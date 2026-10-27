import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const authoringDir = path.join(rootDir, 'content-private', 'authoring');
const curriculumDir = path.join(rootDir, 'src', 'data', 'curriculum');

const subjects = ['rika', 'sansu', 'shakai'];
const files = [
  'questions.json',
  'skills.json',
  'practice.json',
  'transfer.json',
  'integrated.json',
  'stage2.json',
  'figures.json',
];

for (const sub of subjects) {
  const subDestDir = path.join(curriculumDir, sub);
  if (!fs.existsSync(subDestDir)) {
    fs.mkdirSync(subDestDir, { recursive: true });
  }

  const subSrcDir = path.join(authoringDir, sub);
  for (const f of files) {
    const srcFile = path.join(subSrcDir, f);
    const destFile = path.join(subDestDir, f);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied ${sub}/${f}`);
    }
  }
}

console.log('Curriculum files copied successfully.');
