import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * PR5 / H5 / REQ-scraper-documents-1..3 — destination policy enforcement.
 *
 * Rejects non-http(s) schemes, resolves hostnames via DNS, and checks
 * every A/AAAA record against an internal deny-list (loopback, link-local,
 * private, ULA). An explicit `SSRF_ALLOWED_CIDRS` env (comma-separated
 * CIDRs) can carve out exceptions; default is empty.
 */
const DENY_CIDRS_V4 = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
  '0.0.0.0/8',
];
const DENY_CIDRS_V6 = ['::1/128', 'fc00::/7', 'fe80::/10'];

@Injectable()
export class SsrfGuard {
  private readonly logger = new Logger(SsrfGuard.name);
  private readonly deny: string[];
  private readonly allow: string[];

  constructor() {
    this.deny = [...DENY_CIDRS_V4, ...DENY_CIDRS_V6];
    const envAllow = process.env.SSRF_ALLOWED_CIDRS ?? '';
    this.allow = envAllow
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Reject non-http(s), resolve DNS, check every A/AAAA against deny + allow lists.
   * @throws BadRequestException with a client-safe message.
   */
  async assertSafeUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Blocked: non-HTTP scheme');
    }

    const host = parsed.hostname;
    const literal = isIP(host);
    let addresses: string[];
    if (literal) {
      addresses = [host];
    } else {
      try {
        const recs = await lookup(host, { all: true, verbatim: true });
        addresses = recs.map((r) => r.address);
      } catch {
        throw new BadRequestException('Blocked: cannot resolve host');
      }
    }

    for (const ip of addresses) {
      if (this.allow.some((c) => cidrContains(c, ip))) continue;
      if (this.deny.some((c) => cidrContains(c, ip))) {
        // Client-safe message — never leaks the internal IP.
        throw new BadRequestException('Blocked: destination not allowed');
      }
    }
  }
}

/** Convert an IP address to a BigInt for CIDR math. */
function ipToBigInt(ip: string): bigint {
  if (ip.includes(':')) {
    return BigInt('0x' + ip.replaceAll(':', '').padStart(32, '0'));
  }
  return BigInt(ip.split('.').reduce((a, o) => a * 256 + Number(o), 0));
}

/** Does the given CIDR contain the IP? */
function cidrContains(cidr: string, ip: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const mask =
    bits === 0 ? 0n : (~0n << BigInt(128 - bits)) & ((1n << 128n) - 1n);
  const a = ipToBigInt(base) & mask;
  const b = ipToBigInt(ip) & mask;
  return a === b;
}
