(async () => {
    const fs = require('fs').promises;
    fs.constants = require("fs").constants;
    const path = require("path");

    const config = require("./package.json");
    let storyObject = require("./template.json");
    const operators = require("./operators");

    const mkdirp = (path) => fs.mkdir(path, {recursive: true}).catch(e => {
        if (e && e.code !== 'EEXIST') throw e;
    })

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
        .split(/\n{2,}/)

    for (let stateString of vnScript) {
        let state = {};
        const splitterState = stateString.split("\n");
        for (let string of splitterState) {
            if (string.startsWith("%")) {
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
                    throw new Error(`Unknown operator ${result[1]}`);
                }
            }
        }
        state = operators.defReplica(state, splitterState.filter(s => s.length && !s.startsWith("%")).join("\n"))

        //place for attempt make short version

        storyObject.script.scenario.push(state);
    }

    storyObject.version = config.version

    console.log(storyObject);
    let startPath = "story"
    await mkdirp(path.join(startPath, "assets"));
    let promiseArr = [];
    //backgrounds
    await mkdirp(path.join(startPath, 'assets', "locations"))
    for (let location of storyObject.assets.backgrounds) {
        promiseArr.push(fs.writeFile(path.join(startPath, 'assets', "locations", location), ""))
    }
    await Promise.all(promiseArr);
    promiseArr = [];
    //char
    await mkdirp(path.join(startPath, 'assets', "char"))
    for (let char in storyObject.assets.characters) {
        const charPath = path.join(startPath, 'assets', "char", char)
        promiseArr.push(
            mkdirp(charPath).then(() => {
                fs.writeFile(path.join(charPath, "index.png"), "")
            })
        )
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
                ""
            )));
        })())
    }
    await Promise.all(promiseArr);
    promiseArr = [];

    await fs.writeFile(path.join(startPath,"script.json"), JSON.stringify(storyObject.script, null, "  "));
    delete storyObject.script;
    delete storyObject.assets;
    delete storyObject._ids;
    await fs.writeFile(path.join(startPath,"index.json"), JSON.stringify(storyObject, null, "  "));


})();
