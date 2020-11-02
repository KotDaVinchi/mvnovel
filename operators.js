const mock = (name) => {
    return (obj) => {
        console.log(name, obj);
        return [obj.state, obj.storyObject];
    }
}

const name = ({state, storyObject, operands}) => {
    let charId = operands.split(" ")[0];

    if (charId === "я") {
        charId = "me";
    }

    if (!storyObject.script.characters[charId] && (charId !== "me")) {
        throw new Error(`Unknown character ${charId}`);
    }

    state.scene = state.scene || {};
    state.scene.charId = charId;

    return state
};

const bcg = ({state, storyObject, operands}) => {
    const background = operands.split(" ")[0];

    state.background = background;

    storyObject.assets = storyObject.assets || {};
    storyObject.assets.backgrounds = storyObject.assets.backgrounds || []
    storyObject.assets.backgrounds.push(background);
    return [state, storyObject]
};

const sprite = ({state, storyObject, operands}) => {
    const emotion = operands.split(" ")[0];

    state.scene = state.scene || {};
    state.scene.sprite = emotion;

    if (state.scene.charId) {
        storyObject.assets = storyObject.assets || {};
        storyObject.assets.characters = storyObject.assets.characters || {}
        storyObject.assets.characters[state.scene.charId] = storyObject.assets.characters[state.scene.charId] || ["index.png"]
        storyObject.assets.characters[state.scene.charId].push(emotion + ".png");
        storyObject.assets.characters[state.scene.charId].filter((value, index, array) => array.indexOf(value) === index)//dedupe
    }
    return [state, storyObject]
};

const action = ({state, storyObject, operands}) => {
    const action = operands.split(" ");

    state.scene = state.scene || {};
    state.scene.action = state.scene.action || [];
    state.scene.action.push([action])

    return [state, storyObject]
};

const sound = ({state, storyObject, operands}) => {
    state.sound = operands.split(" ")[0];

    //todo: sound local for story?

    return [state, storyObject]
};

const spec = ({state, storyObject, operands}) => {
    const special = operands.split(" ")[0];

    state.scene = state.scene || {};
    state.scene.special = special;

    return [state, storyObject]
};

const checkpoint = ({state, storyObject, operands}) => {
    const checkpoint = operands.split(" ")[0];

    state.checkpoint = checkpoint;

    if (!storyObject.script.checkpoints.some((value) => value.id === checkpoint)) {
        throw new Error(`Unknown checkpoint ${checkpoint}`);
    }

    return [state, storyObject]
};

const id = ({state, storyObject, operands}) => {
    const id = operands.split(" ")[0];

    state.id = id;

    storyObject._ids = storyObject._ids || {state: [], operators: []}
    storyObject._ids.state.push(id);
    //todo: need check ids after end

    return [state, storyObject]
};

const option = ({state, storyObject, operands}) => {
    let cost;
    if (operands.indexOf("{") + 1) {
        console.log(operands)
        const reResult = /\{[^\}]+\}/.exec(operands);
        console.log(reResult[0]);
        cost = JSON.parse(reResult[0]);
        operands = operands.split(/\{[^\}]+\}/).join("");
    }

    let [next, ...title] = operands.split(" ").filter(_ => !!_);
    title = title.join(" ")

    state.scene = state.scene || {};
    state.scene.options = state.scene.options || [];
    if (cost) {
        state.scene.options.push({title, next, cost: [cost]})
    } else {
        state.scene.options.push({title, next})
    }

    storyObject._ids = storyObject._ids || {state: [], operators: []}
    storyObject._ids.operators.push(next);
    //todo: need check ids after end

    return [state, storyObject]
};

const next = ({state, storyObject, operands}) => {
    let next = operands.split(" ");
    if(next.length === 1) next = next[0]

    state.scene = state.scene || {};
    state.scene.next = next;

    storyObject._ids = storyObject._ids || {state: [], operators: []}
    storyObject._ids.operators.push(next);
    //todo: need check ids after end

    return [state, storyObject]
};

const scene = ({state, storyObject, operands}) => {
    const scene = JSON.parse(operands);

    state.scene = Object.assign({}, state.scene || {}, scene);

    return [state, storyObject]
};

const char = ({state, storyObject, operands}) => {
    const isAcqu = /(^| )default($| )/m.test(operands);
    operands = operands.split(/(?:^| )default(?:$| )/).join("");

    const [charId, name, spriteDir] = operands.split(" ");

    storyObject.script.characters[charId] = {name}
    if (spriteDir) {
        storyObject.script.characters[charId].spriteDir = spriteDir;
    }

    if (isAcqu)
        storyObject.defaultGameState.acquaintance[charId] = isAcqu;

    return [state, storyObject]
};

const checkpointName = ({state, storyObject, operands}) => {
    const [id, title] = operands.split(" ");

    storyObject.script.checkpoints.push({id, title});

    return [state, storyObject]
};

const makeSimpleFields = (fieldName) => {

    return ({state, storyObject, operands}) => {

        storyObject[fieldName] = operands.split(' ')[0];

        return [state, storyObject];
    }
}

const storyTitle = makeSimpleFields("title");
const description = makeSimpleFields("fullDescription");

//%раса simple [casual] простой наряд
const makeWardrobeFields = (wardrobeSet) => {
    return ({state, storyObject, operands}) => {
        const reResult = /\[([^\]]+)\]/.exec(operands);
        const tags = reResult[1].split(" ").filter(_ => !!_);
        operands = operands.split(/\[(?:[^\]]+)\]/).join("");

        let cost;
        if (operands.indexOf("{") + 1){
            const jsonReResult = /\{[^\}]+\}/.exec(operands);
            cost = JSON.parse(jsonReResult[0]);
            operands = operands.split(/\{[^\}]+\}/).join("");
        }

        const isDefault = /(^| )default($| )/m.test(operands);
        operands = operands.split(/(?:^| )default(?:$| )/).join("");
        let [name, ...title] = operands.split(" ").filter(_ => !!_);

        let index = storyObject.script.wardrobe.findIndex((value) => value.name === wardrobeSet);
        if (index === -1) {
            index = storyObject.script.wardrobe.push({name: wardrobeSet, set: []}) - 1;
        }
        title = title.filter(_ => !!_).join(" ");
        if(cost) {
            storyObject.script.wardrobe[index].set.push({
                name,
                tags,
                title: title,
                cost: [cost]
            });
        } else {
            storyObject.script.wardrobe[index].set.push({
                name,
                tags,
                title: title
            });
        }

        if (isDefault) {
            storyObject.defaultGameState.userLook[wardrobeSet] = name;
        }

        return [state, storyObject]
    };
}

const nation = makeWardrobeFields("nation")
const hair = makeWardrobeFields("hair")
const clothes = makeWardrobeFields("clothes")

const defReplica = (state, replica) => {
    state.scene = state.scene || {};
    state.scene.replica = replica;
    return state
};


module.exports = {
    storyTitle,
    "названиеИстории": storyTitle,
    description,
    "описаниеИстории": description,
    nation,
    "раса": nation,
    hair,
    "причёска": hair,
    clothes,
    "наряд": clothes,
    name,
    "имя": name,
    bcg,
    "фон": bcg,
    sprite,
    "спрайт": sprite,
    action,
    "действие": action,
    sound,
    "звук": sound,
    spec,
    "спец": spec,
    checkpoint,
    "чекпоинт": checkpoint,
    id,
    "ид": id,
    option,
    "вариант": option,
    "выбор": option,
    next,
    "дальше": next,
    scene,
    "сцена": scene,
    char,
    "перс": char,
    checkpointName,
    "чекпоинтИмя": checkpointName,
    defReplica
}
