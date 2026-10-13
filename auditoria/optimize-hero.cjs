const path=require('node:path');const sharp=require(path.join(process.argv[2],'node_modules/sharp'));
sharp(process.argv[3]).resize({width:900,withoutEnlargement:true}).webp({quality:88,alphaQuality:100,effort:6}).toFile(path.resolve(__dirname,'../img/hero-superstar.webp')).then(info=>console.log(JSON.stringify(info))).catch(e=>{console.error(e);process.exitCode=1;});
