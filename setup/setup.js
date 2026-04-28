#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_FILE = path.join(__dirname, 'package-config.json');
const ROOT_DIR = path.join(__dirname, '..');
const NEST_CLI_PATH = path.join(ROOT_DIR, 'nest-cli.json');
const ROOT_PKG_PATH = path.join(ROOT_DIR, 'package.json');
const ENV_TEMPLATE_PATH = path.join(__dirname, 'templates', '.env.template');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const SELECTION_PATH = path.join(__dirname, 'selection.json');

const ENDC = '\033[0m';
const BOLD = '\033[1m';
const CYAN = '\033[36m';
const GREEN = '\033[32m';
const YELLOW = '\033[33m';
const RED = '\033[31m';

function log(message, color = '') {
  console.log(`${color}${message}${ENDC}`);
}

function logStep(step, message) {
  log(`\n${BOLD}${CYAN}[${step}]${ENDC} ${message}`, BOLD);
}

function logSuccess(message) {
  log(`  ${GREEN}✓${ENDC} ${message}`, GREEN);
}

function logWarning(message) {
  log(`  ${YELLOW}!${ENDC} ${message}`, YELLOW);
}

function logError(message) {
  log(`  ${RED}✗${ENDC} ${message}`, RED);
}

function question(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (error) {
    logError(`Error loading config: ${error.message}`);
    process.exit(1);
  }
}

function loadNestCli() {
  try {
    return JSON.parse(fs.readFileSync(NEST_CLI_PATH, 'utf8'));
  } catch (error) {
    logError(`Error loading nest-cli.json: ${error.message}`);
    process.exit(1);
  }
}

function loadRootPkg() {
  try {
    return JSON.parse(fs.readFileSync(ROOT_PKG_PATH, 'utf8'));
  } catch (error) {
    logError(`Error loading package.json: ${error.message}`);
    process.exit(1);
  }
}

function saveNestCli(nestCli) {
  fs.writeFileSync(NEST_CLI_PATH, JSON.stringify(nestCli, null, 2) + '\n');
}

function saveRootPkg(pkg) {
  fs.writeFileSync(ROOT_PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
}

function saveSelection(selection) {
  fs.writeFileSync(SELECTION_PATH, JSON.stringify(selection, null, 2) + '\n');
}

async function showWelcome() {
  console.clear();
  log('\n');
  log('  ╔════════════════════════════════════════════════════════════╗', CYAN);
  log('  ║                                                            ║', CYAN);
  log('  ║       NestJS Boilerplate - Package Selection Setup         ║', CYAN);
  log('  ║                                                            ║', CYAN);
  log('  ╚════════════════════════════════════════════════════════════╝', CYAN);
  log('\n');
  log('  This wizard will help you select which packages to include', BOLD);
  log('  in your boilerplate project.\n', BOLD);
}

async function showPackageSelection(config) {
  logStep('1', 'Package Selection');
  log('  Select packages to include in your project:\n');

  const selected = {};

  for (const pkg of config.packages) {
    const defaultChoice = pkg.selected ? 'Y' : 'n';
    const answer = await question(
      `  [${pkg.selected ? GREEN + 'x' + ENDC : ' '}] ${BOLD}${pkg.name}${ENDC} - ${pkg.description}\n` +
      `      Include? (${GREEN}Y${ENDC}/${RED}n${ENDC}) [${defaultChoice === 'Y' ? GREEN : RED}${defaultChoice}${ENDC}]: `
    );

    const choice = answer.trim().toLowerCase() || defaultChoice;
    selected[pkg.id] = choice === 'y' || choice === 'Y';
  }

  return selected;
}

async function showEnvVarCollection(config, selectedPackages) {
  logStep('2', 'Environment Variables');
  log('  Configure environment variables for selected packages:\n');

  const envValues = {};

  for (const pkg of config.packages) {
    if (!selectedPackages[pkg.id]) continue;

    for (const envVar of pkg.envVars) {
      const currentValue = envValues[envVar.name] || envVar.default || '';

      if (envVar.required && !currentValue) {
        const value = await question(
          `  ${RED}*${ENDC} ${BOLD}${envVar.name}${ENDC} - ${envVar.description}\n` +
          `    Value: `
        );
        envValues[envVar.name] = value.trim();
      } else if (!envVar.required) {
        const value = await question(
          `  ${envVar.name} - ${envVar.description}\n` +
          `    Value [${CYAN}${currentValue}${ENDC}]: `
        );
        envValues[envVar.name] = value.trim() || currentValue;
      }
    }
  }

  if (config.app && config.app.selectedEnvVars) {
    for (const envVar of config.app.selectedEnvVars) {
      const currentValue = envValues[envVar.name] || envVar.default || '';
      const value = await question(
        `  ${envVar.name} - ${envVar.description}\n` +
        `    Value [${CYAN}${currentValue}${ENDC}]: `
      );
      envValues[envVar.name] = value.trim() || currentValue;
    }
  }

  return envValues;
}

function updateNestCli(nestCli, selectedPackages) {
  const projects = {};

  projects['nominas'] = nestCli.projects['nominas'];

  for (const [id, selected] of Object.entries(selectedPackages)) {
    if (selected && nestCli.projects[id]) {
      projects[id] = nestCli.projects[id];
    }
  }

  nestCli.projects = projects;
}

function getPackageDependencies(config, selectedPackages) {
  const deps = {};
  const peerDeps = {};

  for (const pkg of config.packages) {
    if (!selectedPackages[pkg.id]) continue;

    for (const [name, version] of Object.entries(pkg.dependencies)) {
      deps[name] = version;
    }

    for (const [name, version] of Object.entries(pkg.peerDependencies)) {
      peerDeps[name] = version;
    }
  }

  return { deps, peerDeps };
}

function updateRootPkg(rootPkg, selectedPackages, config) {
  const { deps, peerDeps } = getPackageDependencies(config, selectedPackages);

  rootPkg.dependencies = rootPkg.dependencies || {};

  for (const [name, version] of Object.entries(deps)) {
    rootPkg.dependencies[name] = version;
  }

  for (const [name, version] of Object.entries(peerDeps)) {
    if (!rootPkg.dependencies[name]) {
      rootPkg.dependencies[name] = version;
    }
  }

  const allSelected = Object.values(selectedPackages).every(v => v);
  if (!allSelected) {
    const toRemove = [];
    for (const name in rootPkg.dependencies) {
      let found = false;
      for (const pkg of config.packages) {
        if (selectedPackages[pkg.id] && pkg.dependencies[name]) {
          found = true;
          break;
        }
      }
      if (!found) {
        toRemove.push(name);
      }
    }
    for (const name of toRemove) {
      delete rootPkg.dependencies[name];
    }
  }
}

function generateEnvFile(envValues, selectedPackages, config) {
  let content = '# NestJS Boilerplate Environment Variables\n';
  content += '# Generated by setup wizard\n\n';
  content += '# ============================================\n';
  content += '# Application\n';
  content += '# ============================================\n\n';

  if (config.app && config.app.selectedEnvVars) {
    for (const envVar of config.app.selectedEnvVars) {
      content += `# ${envVar.description}\n`;
      content += `${envVar.name}=${envValues[envVar.name] || envVar.default || ''}\n\n`;
    }
  }

  const packageOrder = ['common', 'database', 'auth', 'ai', 'http', 'inngest', 'playwright', 'resend', 'serve-static'];
  const orderedPackages = packageOrder
    .map(id => config.packages.find(p => p.id === id))
    .filter(pkg => pkg && selectedPackages[pkg.id]);

  for (const pkg of orderedPackages) {
    if (pkg.envVars.length === 0) continue;

    content += '# ============================================\n';
    content += `# ${pkg.name}\n`;
    content += '# ============================================\n\n';

    for (const envVar of pkg.envVars) {
      content += `# ${envVar.description}\n`;
      content += `${envVar.name}=${envValues[envVar.name] || envVar.default || ''}\n`;
      if (envVar.required) {
        content += '# Required\n';
      }
      content += '\n';
    }
    content += '\n';
  }

  content += '# ============================================\n';
  content += '# Package Selection Summary\n';
  content += '# ============================================\n';
  content += '# Selected packages: ' + Object.entries(selectedPackages)\n    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(', ') + '\n';

  fs.writeFileSync(ENV_PATH, content);
}

async function showCompletion(selectedPackages, envValues) {
  logStep('3', 'Setup Complete');
  logSuccess('Configuration files updated successfully!\n');

  log('  Selected packages:', BOLD);
  for (const [id, selected] of Object.entries(selectedPackages)) {
    if (selected) {
      log(`    ${GREEN}✓${ENDC} ${id}`);
    }
  }
  log('');

  const selectedCount = Object.values(selectedPackages).filter(v => v).length;
  const totalCount = Object.keys(selectedPackages).length;

  log(`  ${BOLD}Package Selection:${ENDC} ${selectedCount}/${totalCount} packages selected\n`);

  console.log('  ' + '='.repeat(55));
  console.log('');
  log('  Next steps:', BOLD + CYAN);
  console.log('');
  log('  1. Run: npm install');
  log('  2. Run: npm run build');
  log('  3. Run: npm run start:dev');
  console.log('');
  log('  Or use Docker:', BOLD + CYAN);
  console.log('');
  log('  1. Run: docker-compose up -d');
  log('  2. Access API at http://localhost:3000');
  console.log('');
  console.log('  ' + '='.repeat(55));
}

async function main() {
  const isPostinstall = process.argv.includes('--postinstall');

  await showWelcome();

  const config = loadConfig();

  const savedSelection = (() => {
    try {
      if (fs.existsSync(SELECTION_PATH)) {
        return JSON.parse(fs.readFileSync(SELECTION_PATH, 'utf8'));
      }
    } catch (e) {}
    return null;
  })();

  let selectedPackages;

  if (savedSelection && !isPostinstall) {
    log('  Found previous selection. Loading...', YELLOW);
    const useSaved = await question('  Use saved selection? (Y/n): ');
    if (useSaved.trim().toLowerCase() !== 'n') {
      selectedPackages = savedSelection.selectedPackages;
    } else {
      selectedPackages = await showPackageSelection(config);
    }
  } else if (savedSelection && isPostinstall) {
    log('  Using saved selection from previous setup.', GREEN);
    selectedPackages = savedSelection.selectedPackages;
  } else {
    selectedPackages = await showPackageSelection(config);
  }

  const envValues = await showEnvVarCollection(config, selectedPackages);

  logStep('2b', 'Updating Configuration');

  const nestCli = loadNestCli();
  updateNestCli(nestCli, selectedPackages);
  saveNestCli(nestCli);
  logSuccess('nest-cli.json updated');

  const rootPkg = loadRootPkg();
  updateRootPkg(rootPkg, selectedPackages, config);
  saveRootPkg(rootPkg);
  logSuccess('package.json updated');

  generateEnvFile(envValues, selectedPackages, config);
  logSuccess('.env file created');

  saveSelection({
    selectedPackages,
    timestamp: new Date().toISOString(),
  });
  logSuccess('selection saved for future runs');

  await showCompletion(selectedPackages, envValues);
}

main().catch((error) => {
  logError(`Setup failed: ${error.message}`);
  process.exit(1);
});
