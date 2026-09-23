// 출력 xlsm 셀 값 검증
import JSZip from 'jszip';
import fs from 'fs';

const z = await JSZip.loadAsync(fs.readFileSync('경혈_데이터_405_WHO_해부학검수_자침.xlsm'));
const ss = await z.file('xl/sharedStrings.xml').async('string');
const strs = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(''));
const wb = await z.file('xl/workbook.xml').async('string');
const rels = await z.file('xl/_rels/workbook.xml.rels').async('string');
const relMap = Object.fromEntries([...rels.matchAll(/<Relationship [^>]*>/g)].map(m => [m[0].match(/Id="([^"]+)"/)[1], m[0].match(/Target="([^"]+)"/)[1]]));
const sheetMap = Object.fromEntries([...wb.matchAll(/<sheet [^>]*>/g)].map(m => [m[0].match(/name="([^"]+)"/)[1], relMap[m[0].match(/r:id="([^"]+)"/)[1]]]));
const read = async name => {
  const path = 'xl/' + sheetMap[name].replace(/^\/?xl\//, '');
  const x = await z.file(path).async('string');
  const o = {};
  for (const m of x.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const v = (m[4] || '').match(/<v>([\s\S]*?)<\/v>/);
    const is = (m[4] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/);
    o[m[1] + m[2]] = /t="s"/.test(m[3]) && v ? strs[+v[1]] : is ? is[1] : v ? +v[1] : '';
  }
  return o;
};
const main = await read('경혈 405');
console.log('S341', JSON.stringify(main.S341), '| J341', main.J341, '| Y341', String(main.Y341).slice(0, 40), '| S2', JSON.stringify(main.S2));
const t = await read('자침법');
console.log('자침법 rows', Object.keys(t).filter(k => /^A\d+$/.test(k)).length, '| last', t.A778, t.A779);
const m = await read('실측근거');
for (let r = 2; r <= 78; r += 7) console.log(m['A' + r], m['B' + r], m['C' + r] || '-', m['D' + r], m['F' + r], '|', m['M' + r], '|', m['P' + r], m['Q' + r], m['R' + r], m['S' + r], m['T' + r], m['U' + r]);
const c = await read('검수기준');
for (const k of Object.keys(c).filter(k => /^A\d+$/.test(k) && +k.slice(1) > 55 && c[k])) console.log(k, c[k], '|', String(c['B' + k.slice(1)]).slice(0, 50));
const lg = await read('변경기록');
console.log('변경기록', lg.D2, JSON.stringify(lg.F2), '->', JSON.stringify(lg.G2), '| rows to', Object.keys(lg).filter(k => k.startsWith('A')).length);
