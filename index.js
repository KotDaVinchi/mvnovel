(async () => {
    const fs = require('fs').promises;
    fs.constants = require("fs").constants;
    const path = require("path");

    const config = require("./package.json");
    let storyObject = require("./template.json");
    storyObject._ids = {
        to: [],
        from: []
    }
    storyObject.assets = {
        backgrounds: [],
        characters: {}
    }
    const operators = require("./operators");
    const supressEexist = e => {
        if (e && e.code !== 'EEXIST') throw e;
    }

    const mkdirp = (path) => fs.mkdir(path, {recursive: true}).catch(supressEexist)

    let documentPath = "./document.txt"//todo load from command string or drag'n'drop dunno

    await fs.access(documentPath, fs.constants.R_OK)
        .catch(e => {
            console.error(`cant open file ${documentPath} cause`, e);
            throw e
        })

    let vnScript = await fs.readFile(documentPath, {encoding: "utf-8"})

    //split by states
    vnScript = vnScript
        .replace(/(\r\n|\u2028)/g, "\n")
        .replace(/ {2,}/g, " ")
        .replace(/^ +$/g, "")
        .split(/(?:\n[\f\t\v\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]?)+\n/)

    let hasError = false;
    for (let stateString of vnScript) {
        let state = {};
        const splitterState = stateString.split("\n");
        const replica = [];
        for (let string of splitterState) {
            let splittedString = string.split(/\/\//)
            string = splittedString.shift();
            if (string.length===0) {
                continue;//this is comment
            }
            while (((string.split('"').length-1) % 2) !== 0){
                console.log('while ', string);
                string = string+'//'+splittedString.shift();
            }

            if (string.startsWith("%")) {
                try {
                    const result = /^%([\wа-яА-ЯйЙёЁ]+) ?(.*)/m.exec(string);
                    if (operators[result[1]]) {
                        let opResult = operators[result[1]]({
                            state,
                            storyObject,
                            operands: result[2]
                        })
                        if (!Array.isArray(opResult)) {
                            opResult = [opResult, storyObject]
                        }
                        [state, storyObject] = opResult;
                    } else {
                        throw new Error(`Unknown operator "${result[1]}"`);
                    }
                } catch (e){
                    console.error(`In string "${string}":`);
                    console.error(`In state:`);
                    console.error("---state---");
                    console.error(stateString);
                    console.error("---state---");
                    console.error(e);
                    console.error(``);
                    hasError = true;
                }
            } else {
                replica.push(string)
            }
        }
        state = operators.defReplica(state, replica.join("\n"))

        if(!state || state.scene.replica.replace(/\s/,'') === 0){
            console.error(`In state:`);
            console.error("---state---");
            console.error(stateString);
            console.error("---state---");
            console.error("State without text");
            console.error(``);

            // hasError = true;
        }

        //place for attempt make short version
        if(state) storyObject.script.scenario.push(state);
    }

    storyObject.version = config.version


    storyObject._ids.to = storyObject._ids.to.filter((v,i,arr)=>arr.indexOf(v)===i);
    storyObject._ids.from = storyObject._ids.from.filter((v,i,arr)=>arr.indexOf(v)===i);
    storyObject._ids.from.forEach(idFrom => {
        if(storyObject._ids.to.indexOf(idFrom) === -1){
            console.error(`Can't find "${idFrom}" id!`);
            hasError = true;
        }
    })

    if(hasError){
        console.log('Cant create story due errors!');
        return;
    }


    let startPath = "story"
    await mkdirp(path.join(startPath, "assets"));
    let promiseArr = [];
    //backgrounds
    await mkdirp(path.join(startPath, 'assets', "locations"))
    for (let location of storyObject.assets.backgrounds) {
        promiseArr.push(fs.writeFile(path.join(startPath, 'assets', "locations", location), "", {flag:"wx"}).catch(supressEexist))
    }
    await Promise.all(promiseArr);
    promiseArr = [];
    //char
    await mkdirp(path.join(startPath, 'assets', "char"))
    for (let char in storyObject.assets.characters) {
        for (let charSprite of storyObject.assets.characters[char]){
            const charPath = path.join(startPath, 'assets', "char", char)
            promiseArr.push(
                mkdirp(charPath).then(() => {
                    return fs.writeFile(path.join(charPath, charSprite), "", {flag:"wx"}).catch(supressEexist)
                })
            )
        }
    }
    await Promise.all(promiseArr);
    promiseArr = [];
    //wardrobe
    const wardrobePath = path.join(startPath, 'assets', "wardrobe");
    await mkdirp(wardrobePath);
    for (let wardrobeSet of storyObject.script.wardrobe) {
        promiseArr.push((async () => {
            await mkdirp(path.join(wardrobePath, wardrobeSet.name))

            await Promise.all(wardrobeSet.set.map(wardrobeItem => fs.writeFile(
                path.join(wardrobePath, wardrobeSet.name, wardrobeItem.name),
                "",
                {flag:"wx"})
                    .catch(supressEexist)));
        })())
    }
    await Promise.all(promiseArr);
    promiseArr = [];

    await fs.writeFile(path.join(startPath,"script.json"), JSON.stringify(storyObject.script, null, "  "));
    delete storyObject.script;
    delete storyObject.assets;
    delete storyObject._ids;
    await fs.writeFile(path.join(startPath,"index.json"), JSON.stringify(storyObject, null, "  "));

    console.log("NOVEL SUCCESSFULLY INTERPRETED!");

})();
