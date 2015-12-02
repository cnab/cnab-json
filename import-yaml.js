'use strict';
var fs = require('fs'),
    path = require('path'),
    yaml = require('js-yaml');

const yamlDir = './node_modules/cnab_yaml',
    yamlCnab240 = yamlDir + '/cnab240',
    yamlCnab400 = yamlDir + '/cnab400';

var convert = (input, output) => {
    try {
        let str = fs.readFileSync(input, 'utf8'),
            doc = yaml.safeLoad(str),
            keys = Object.keys(doc),
            data = {};
        for(let i=0; i<keys.length; i++) {
            let key = keys[i],
                val = doc[key];

            if (typeof val === 'string') {
                data[key] = val;
            } else {
                let field = {
                    pos: val.pos,
                    type: '',
                    size: 0,
                    picture: val.picture,
                    default: val.default
                };

                let picture = val.picture,
                    reSize = /\([\d]+\)/;

                let size = (str) => {
                    let om = str.match(reSize);
                    if (om && om.length) {
                        return Number(om[0].replace(/\(|\)/g, ''));
                    } else {
                        return undefined;
                    }
                };

                if (picture.match(/9\([\d]+\)(V9\([\d]+\)])*/)) {
                    field.type = 'number';
                    let s = picture.split('V');
                    field.size = size(s[0]);
                    if (s.length > 1) {
                        field.precision = size(s[1]);
                        field.size += field.precision;
                    }
                } else if (picture.match(/X\([\d]+\)/)) {
                    field.type = 'alfa';
                    field.size = size(picture);
                } else {
                    console.log('type not found', input, key, picture);
                }

                if (val.data_format) {
                    field.data = true;
                }
                data[key] = field;
            }
        }

        fs.writeFileSync(output, JSON.stringify(data, 0, '   '), 'utf8');
        return data;
    } catch (e) {
        console.log(e);
    }
};

var reader = (inDir, outDir) => {
    let files = fs.readdirSync(inDir),
        data = {};
    for (let i=0; i<files.length; i++) {
        let name = files[i],
            inFile = path.resolve(inDir, name),
            outFile = path.resolve(outDir, name.replace('.yml', '.json'));
        if (fs.statSync(inFile).isFile()) {
            data[name.replace('.yml', '')] = convert(inFile, outFile);
        } else {
            let subOutDir = outFile,
                subInDir = inFile;

            mkdir(subOutDir);

            data[name] = reader(subInDir, subOutDir);
        }
    }
    return data;
};

var mkdir = (dirName) => {
    !fs.existsSync(dirName) && fs.mkdirSync(dirName);
};
// import 240
let cnab240 = `${__dirname}/cnab240`;
mkdir(cnab240);
let data240 = reader(yamlCnab240, cnab240);
fs.writeFileSync(`${__dirname}/cnab240.json`, JSON.stringify(data240, 0, '   '), 'utf8');

// import 400
var cnab400 = `${__dirname}/cnab400`;
mkdir(cnab400);
let data400 = reader(yamlCnab400, cnab400);
fs.writeFileSync(`${__dirname}/cnab400.json`, JSON.stringify(data400, 0, '   '), 'utf8');