#!/usr/bin/env node

/**
 * i18n Management Tool
 * 
 * Usage:
 *   npm run i18n:validate  - Validate translations
 *   npm run i18n:extract   - Extract unused/missing keys
 *   npm run i18n:split     - Split monolithic JSON files
 *   npm run i18n:merge     - Merge modular files back to monolithic
 *   npm run i18n:stats     - Show translation statistics
 */

const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'src', 'lib', 'i18n');
const LOCALES_DIR = path.join(I18N_DIR, 'locales');
const MODULES_DIR = path.join(LOCALES_DIR, 'modules');

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Load JSON file safely
const loadJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error.message);
    return null;
  }
};

// Save JSON file with formatting
const saveJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ Saved: ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to save ${filePath}:`, error.message);
  }
};

// Split monolithic translation files into modules
const splitTranslations = () => {
  console.log('🔧 Splitting monolithic translation files...');
  
  ensureDir(MODULES_DIR);
  
  const languages = ['en-US', 'ko'];
  
  languages.forEach(lang => {
    const inputFile = path.join(LOCALES_DIR, `${lang}.json`);
    const translations = loadJSON(inputFile);
    
    if (!translations) return;
    
    // Define module structure
    const modules = {
      navigation: ['navigation'],
      camera: ['camera'],
      timeline: ['timeline'],
      discover: ['discover'],
      progress: ['progress'],
      aiCoach: ['aiCoach'],
      mealDetail: ['mealDetail'],
      notifications: ['notifications'],
      privacy: ['privacy'],
      goals: ['goals'],
      settingsMain: ['settingsMain'],
      common: ['common'],
      errors: ['errors'],
      settings: ['settings'],
    };
    
    // Split translations by module
    Object.entries(modules).forEach(([moduleName, keys]) => {
      const moduleData = {};
      
      keys.forEach(key => {
        if (translations[key]) {
          moduleData[key] = translations[key];
        }
      });
      
      if (Object.keys(moduleData).length > 0) {
        const langCode = lang === 'en-US' ? 'en' : lang;
        const outputFile = path.join(MODULES_DIR, `${moduleName}.${langCode}.json`);
        saveJSON(outputFile, moduleData);
      }
    });
  });
  
  console.log('✅ Translation splitting completed!');
};

// Merge modular files back to monolithic
const mergeTranslations = () => {
  console.log('🔧 Merging modular translation files...');
  
  const languages = ['en', 'ko'];
  
  languages.forEach(lang => {
    const mergedTranslations = {};
    
    // Read all module files for this language
    const moduleFiles = fs.readdirSync(MODULES_DIR)
      .filter(file => file.endsWith(`.${lang}.json`));
    
    moduleFiles.forEach(file => {
      const modulePath = path.join(MODULES_DIR, file);
      const moduleData = loadJSON(modulePath);
      
      if (moduleData) {
        Object.assign(mergedTranslations, moduleData);
      }
    });
    
    // Save merged file
    const outputLang = lang === 'en' ? 'en-US' : lang;
    const outputFile = path.join(LOCALES_DIR, `${outputLang}.json`);
    saveJSON(outputFile, mergedTranslations);
  });
  
  console.log('✅ Translation merging completed!');
};

// Extract translation keys from TypeScript files
const extractKeysFromCode = () => {
  console.log('🔍 Extracting translation keys from code...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const appDir = path.join(__dirname, '..', 'app');
  
  const extractKeysFromFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const keyRegex = /(?:t|translate)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const keys = [];
    let match;
    
    while ((match = keyRegex.exec(content)) !== null) {
      keys.push(match[1]);
    }
    
    return keys;
  };
  
  const getAllTsFiles = (dir) => {
    const files = [];
    
    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      });
    };
    
    if (fs.existsSync(dir)) {
      scanDir(dir);
    }
    
    return files;
  };
  
  const allFiles = [...getAllTsFiles(srcDir), ...getAllTsFiles(appDir)];
  const allKeys = new Set();
  
  allFiles.forEach(file => {
    const keys = extractKeysFromFile(file);
    keys.forEach(key => allKeys.add(key));
  });
  
  console.log(`📊 Found ${allKeys.size} unique translation keys in code`);
  
  // Save extracted keys
  const outputFile = path.join(I18N_DIR, 'extracted-keys.json');
  saveJSON(outputFile, Array.from(allKeys).sort());
  
  return Array.from(allKeys);
};

// Validate translations
const validateTranslations = () => {
  console.log('✅ Validating translations...');
  
  const enFile = path.join(LOCALES_DIR, 'en-US.json');
  const koFile = path.join(LOCALES_DIR, 'ko.json');
  
  const enTranslations = loadJSON(enFile);
  const koTranslations = loadJSON(koFile);
  
  if (!enTranslations || !koTranslations) {
    console.error('❌ Failed to load translation files');
    return;
  }
  
  const issues = [];
  
  // Check for missing keys
  const checkMissingKeys = (enObj, koObj, path = '') => {
    Object.keys(enObj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in koObj)) {
        issues.push(`Missing Korean key: ${currentPath}`);
      } else if (typeof enObj[key] === 'object' && enObj[key] !== null) {
        if (typeof koObj[key] !== 'object' || koObj[key] === null) {
          issues.push(`Type mismatch at: ${currentPath}`);
        } else {
          checkMissingKeys(enObj[key], koObj[key], currentPath);
        }
      }
    });
  };
  
  checkMissingKeys(enTranslations, koTranslations);
  
  if (issues.length === 0) {
    console.log('✅ All translations are valid!');
  } else {
    console.log(`⚠️  Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues;
};

// Find unused keys
const findUnusedKeys = () => {
  console.log('🔍 Finding unused translation keys...');
  
  const usedKeys = extractKeysFromCode();
  const enFile = path.join(LOCALES_DIR, 'en-US.json');
  const enTranslations = loadJSON(enFile);
  
  if (!enTranslations) return;
  
  const getAllKeys = (obj, prefix = '') => {
    const keys = [];
    
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    });
    
    return keys;
  };
  
  const allKeys = getAllKeys(enTranslations);
  const unusedKeys = allKeys.filter(key => !usedKeys.includes(key));
  
  if (unusedKeys.length === 0) {
    console.log('✅ No unused keys found!');
  } else {
    console.log(`🗑️  Found ${unusedKeys.length} unused keys:`);
    unusedKeys.forEach(key => console.log(`   - ${key}`));
  }
  
  return unusedKeys;
};

// Show statistics
const showStats = () => {
  console.log('📊 Translation Statistics:');
  
  const enFile = path.join(LOCALES_DIR, 'en-US.json');
  const koFile = path.join(LOCALES_DIR, 'ko.json');
  
  const enTranslations = loadJSON(enFile);
  const koTranslations = loadJSON(koFile);
  
  if (!enTranslations || !koTranslations) return;
  
  const countKeys = (obj) => {
    let count = 0;
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += countKeys(obj[key]);
      } else {
        count++;
      }
    });
    return count;
  };
  
  const enKeyCount = countKeys(enTranslations);
  const koKeyCount = countKeys(koTranslations);
  
  console.log(`   English keys: ${enKeyCount}`);
  console.log(`   Korean keys: ${koKeyCount}`);
  console.log(`   Namespaces: ${Object.keys(enTranslations).length}`);
  console.log(`   Completion: ${((koKeyCount / enKeyCount) * 100).toFixed(1)}%`);
};

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'split':
    splitTranslations();
    break;
  case 'merge':
    mergeTranslations();
    break;
  case 'extract':
    extractKeysFromCode();
    break;
  case 'validate':
    validateTranslations();
    break;
  case 'unused':
    findUnusedKeys();
    break;
  case 'stats':
    showStats();
    break;
  default:
    console.log(`
i18n Management Tool

Usage:
  node scripts/i18n-tools.js <command>

Commands:
  split     - Split monolithic JSON files into modules
  merge     - Merge modular files back to monolithic
  extract   - Extract translation keys from code
  validate  - Validate translation completeness
  unused    - Find unused translation keys
  stats     - Show translation statistics

Examples:
  node scripts/i18n-tools.js split
  node scripts/i18n-tools.js validate
    `);
}