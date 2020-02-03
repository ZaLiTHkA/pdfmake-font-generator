#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let args = process.argv.slice(2);
let inDir, outFile, outFileExt, outFileWrapper;

try {
    switch (args.length) {
        case 2:
            outFileExt = '.js';
            inDir = args[0];
            outFile = args[1];
            outFileWrapper = 'this.pdfMake = this.pdfMake || {};this.pdfMake.vfs = GENERATED_CONTENT';
            break;
        case 3:
            outFileExt = (args[0] === '-t') ? '.ts' : '.js';
            inDir = args[1];
            outFile = args[2];
            outFileWrapper = 'export default { pdfMake: { vfs: GENERATED_CONTENT } }';
            break;
        default:
            throw new Error('incorrect arguments provided. expected "pdfmakefg [-t] <source-folder> <output-file[.extension]>"');
    }

    if (!fs.existsSync(inDir)) {
        throw new Error(`${inDir} does not exists`);
    }

    if (fs.statSync(inDir).isFile()) {
        throw new Error(`${inDir} must be a folder`);
    }

    if (path.extname(outFile).length === 0) {
        outFile = `${outFile}${outFileExt}`;
    }

    if (path.extname(outFile) !== outFileExt) {
        throw new Error(`${outFile} must be a ${outFileExt} file`);
    }

    // TODO: find Apple "ttc" and "dfont" formats to test with...
    const inputExtPattern = /\.(ttf|otf|woff[2]?)$/; // |ttc|dfont
    const readFiles = fs.readdirSync(inDir, {
        encoding: 'utf8'
    }).reduce((list, value) => {
        if (value.match(inputExtPattern)) {
            list.push(path.resolve(inDir, value));
        }
        return list;
    }, []);

    const customFontsObject = readFiles.reduce((output, value) => {
        const fileObject = path.parse(value);
        output[fileObject.base] = fs.readFileSync(path.resolve(fileObject.dir, fileObject.base), {
            encoding: 'base64'
        });
        return output;
    }, {});

    fs.writeFileSync(outFile, outFileWrapper.replace('GENERATED_CONTENT', JSON.stringify(customFontsObject)));
    console.log('The fonts were generated.');
} catch (err) {
    console.log('error:', err.message || error);
}
