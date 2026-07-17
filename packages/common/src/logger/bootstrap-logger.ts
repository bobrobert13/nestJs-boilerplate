import { Logger } from '@nestjs/common';
import { LogCategory } from './log-category.enum';

/**
 * Whether `LOG_STYLE` was set to `plain` via env var — evaluated once on load.
 * When `true` the helper falls back to simple `[Category]` prefixes instead of
 * box-drawing characters, which is safer for log aggregators that dislike Unicode.
 */
const IS_PLAIN = process.env.LOG_STYLE === 'plain';

/**
 * Static helper for consistent, visually grouped startup and feature-summary
 * log messages.  Zero dependencies beyond `@nestjs/common`'s `Logger`.
 *
 * Usage:
 * ```ts
 * BootstrapLogger.log(LogCategory.DB, 'Connecting...');
 * BootstrapLogger.step('Database', 342);
 * BootstrapLogger.section('Feature Availability');
 * BootstrapLogger.summary({ MongoDB: 'connected', Auth: 'JWT · MagicLink' });
 * BootstrapLogger.banner('Boilerplate Service', '1.0');
 * ```
 */
export class BootstrapLogger {
  private static logger = new Logger('Bootstrap');

  /**
   * Log a single categorized message with optional detail appended in parens.
   *
   * Rich format: `  ◉ Category — Message (detail)`
   * Plain format: `[Category] ◉ Message (detail)`
   */
  static log(category: LogCategory, message: string, detail?: string): void {
    const detailStr = detail != null ? ` (${detail})` : '';
    if (IS_PLAIN) {
      BootstrapLogger.logger.log(`[${category}] ◉ ${message}${detailStr}`);
    } else {
      BootstrapLogger.logger.log(`  ◉ ${category} — ${message}${detailStr}`);
    }
  }

  /**
   * Log a bootstrap step with elapsed time in milliseconds.
   * Intended for sequential startup phases such as env validation, DB connect.
   */
  static step(label: string, durationMs?: number): void {
    const timing = durationMs != null ? `(${durationMs}ms)` : '';
    if (IS_PLAIN) {
      BootstrapLogger.logger.log(`[BOOT] ◉ ${label} ${timing}`);
    } else {
      BootstrapLogger.logger.log(`  ◉ ${label} ${timing}`);
    }
  }

  /**
   * Start a visually delimited section.  In rich mode this prints a header
   * line with ── separators.  In plain mode it prints `=== label ===`.
   */
  static section(title: string, items?: string[]): void {
    if (IS_PLAIN) {
      BootstrapLogger.logger.log(`=== ${title} ===`);
    } else {
      BootstrapLogger.logger.log(`╔═══ ${title} ═══╗`);
    }
    if (items) {
      for (const item of items) {
        BootstrapLogger.logger.log(IS_PLAIN ? `  ${item}` : `  ║ ${item}`);
      }
    }
  }

  /**
   * Emit a key-value summary block.  Each key is a feature/module name and
   * each value is its status description (e.g. "connected", "not set (disabled)").
   *
   * Rich format: `  ✓ Key   Value`
   * Plain format: `[BOOT] ✓ Key: Value`
   */
  static summary(items: Record<string, string>): void {
    const keys = Object.keys(items);
    if (keys.length === 0) return;

    if (!IS_PLAIN) {
      BootstrapLogger.logger.log('╔══════════════════════════════════════╗');
      BootstrapLogger.logger.log('║  Feature Availability                ║');
      BootstrapLogger.logger.log('╠══════════════════════════════════════╣');
    } else {
      BootstrapLogger.logger.log('=== Feature Availability ===');
    }

    for (const key of keys) {
      const value = items[key];
      if (IS_PLAIN) {
        BootstrapLogger.logger.log(`[BOOT] ${key}: ${value}`);
      } else {
        const padded = key.padEnd(16);
        BootstrapLogger.logger.log(`║  ${padded}${value}`);
      }
    }

    if (!IS_PLAIN) {
      BootstrapLogger.logger.log('╚══════════════════════════════════════╝');
    }
  }

  /**
   * Print the application startup banner with name, version, HTTP endpoint,
   * and Swagger URL.  Called once at the end of `main.ts` bootstrap.
   *
   * @param title  Application name.
   * @param port   HTTP listen port.
   * @param prefix Global API prefix (default `api`).
   */
  static banner(title: string, port: number, prefix = 'api'): void {
    const version = process.env.npm_package_version ?? '0.0.0';
    const endpoint = `http://localhost:${port}`;

    if (IS_PLAIN) {
      BootstrapLogger.logger.log(`[BOOT] ${title} v${version}`);
      BootstrapLogger.logger.log(`[BOOT] ● HTTP     ${endpoint}`);
      BootstrapLogger.logger.log(`[BOOT] ● Swagger  ${endpoint}/${prefix}`);
    } else {
      const line = '─'.repeat(48);
      BootstrapLogger.logger.log(`╔${line}╗`);
      BootstrapLogger.logger.log(`║  ${title} v${version.padEnd(38)}║`);
      BootstrapLogger.logger.log(`╠${line}╣`);
      BootstrapLogger.logger.log(`║  ● HTTP     ${endpoint.padEnd(32)}║`);
      BootstrapLogger.logger.log(
        `║  ● Swagger  ${(endpoint + '/' + prefix).padEnd(32)}║`,
      );
      BootstrapLogger.logger.log(`╚${line}╝`);
    }

    BootstrapLogger.step('Application ready');
  }

  /**
   * Print a grouped route map extracted from the Swagger OpenAPI document.
   * Routes are grouped by their first tag (controller name), with HTTP methods
   * shown for each path.
   *
   * @param swaggerDocument - The OpenAPI document object created by SwaggerModule.createDocument()
   * @param prefix          - Global API prefix (default `api`), used to strip from display paths
   *
   * Rich output:
   * ```
   * ╔═══ Route Map ═══╗
   * ║  usuarios                          ║
   * ║    GET    /api/usuarios             ║
   * ║    POST   /api/usuarios             ║
   * ║    GET    /api/usuarios/:id         ║
   * ║  auth                              ║
   * ║    POST   /api/auth/login           ║
   * ```
   */
  static routeMap(swaggerDocument: Record<string, any>, prefix = 'api'): void {
    const paths = swaggerDocument?.paths;
    if (!paths || typeof paths !== 'object') return;

    // Collect routes by tag
    const groups = new Map<string, Array<{ method: string; path: string }>>();
    const tagOrder: string[] = [];

    for (const [fullPath, methods] of Object.entries(paths)) {
      if (!methods || typeof methods !== 'object') continue;
      for (const [httpMethod, details] of Object.entries(methods)) {
        if (httpMethod === 'parameters') continue;
        const tags = (details as any)?.tags;
        const tag =
          Array.isArray(tags) && tags.length > 0 ? tags[0] : 'default';
        if (!groups.has(tag)) {
          groups.set(tag, []);
          tagOrder.push(tag);
        }
        const routePath = fullPath.startsWith(`/${prefix}`)
          ? fullPath.slice(prefix.length + 1) || '/'
          : fullPath;
        groups.get(tag)!.push({
          method: httpMethod.toUpperCase(),
          path: routePath,
        });
      }
    }

    if (groups.size === 0) return;

    if (!IS_PLAIN) {
      BootstrapLogger.logger.log('╔═══ Route Map ═══╗');
    } else {
      BootstrapLogger.logger.log('=== Route Map ===');
    }

    for (const tag of tagOrder) {
      const routes = groups.get(tag)!;
      if (IS_PLAIN) {
        BootstrapLogger.logger.log(`[BOOT] [${tag}]`);
      } else {
        BootstrapLogger.logger.log(`  ── ${tag} ──`);
      }
      for (const { method, path } of routes) {
        const methodPadded = method.padEnd(7);
        if (IS_PLAIN) {
          BootstrapLogger.logger.log(`[BOOT]   ${methodPadded} ${path}`);
        } else {
          BootstrapLogger.logger.log(`       ${methodPadded} ${path}`);
        }
      }
    }

    if (!IS_PLAIN) {
      BootstrapLogger.logger.log(`╚${'═'.repeat(22)}╝`);
    }
  }
}
