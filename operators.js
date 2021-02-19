const mock = (name) => {
    return (obj) => {
        console.log(name, obj);
        return [obj.state, obj.storyObject];
    }
}

function trnslt(str) {
    const ru = new Map([
        ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'],
        ['є', 'e'], ['ё', 'e'], ['ж', 'j'], ['з', 'z'], ['и', 'i'], ['ї', 'yi'], ['й', 'i'],
        ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
        ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'h'], ['ц', 'c'], ['ч', 'ch'],
        ['ш', 'sh'], ['щ', 'shkh'], ['ы', 'iy'], ['э', 'e'], ['ю', 'u'], ['я', 'ya'],
    ]);

    str = str.replace(/[ъь]+/g, '');

    return Array.from(str)
        .reduce((s, l) =>
            s + (
                ru.get(l)
                || ru.get(l.toLowerCase()) === undefined && l
                || ru.get(l.toLowerCase()).toUpperCase()
            )
            , '');
}

const name = ({state, storyObject, operands}) => {
    let charId = operands.split(" ")[0];

    if (charId === "я") {
        charId = "me";
    }

    charId = trnslt(charId)

    if (!storyObject.script.characters[charId] && (charId !== "me")) {
        throw new Error(`Unknown character "${charId}"`);
    }

    state.scene = state.scene || {};
    state.scene.charId = charId;

    return [state, storyObject]
};

const bcg = ({state, storyObject, operands}) => {
    let background = operands.split(/\s+/).map(v => trnslt(v));
    background = background.filter(_=>!!_)

    state.background = {
        image: background.length === 1 ? background[0] : background
    };

    storyObject.assets = storyObject.assets || {};
    storyObject.assets.backgrounds = storyObject.assets.backgrounds || []
    storyObject.assets.backgrounds = storyObject.assets.backgrounds.concat(background);
    return [state, storyObject]
};

const sprite = ({state, storyObject, operands}) => {
    const emotion = trnslt(operands.split(" ")[0]);

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

    state.actions = state.actions || [];
    state.actions.push(action);

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

    if (!storyObject.script.checkpoints.some((value) => value.id === checkpoint)) {
        throw new Error(`Unknown checkpoint "${checkpoint}"`);
    }

    state.checkpoint = trnslt(checkpoint);

    return [state, storyObject]
};

const id = ({state, storyObject, operands}) => {
    let id = operands.split(" ")[0];

    if (storyObject._ids.to.indexOf(trnslt(id))+1) throw new Error(`Dublicate id "${id}"!`)
    if (state.id && state.id!==id) throw new Error(`Cant add id "${id}", state already have id.`)
    id = trnslt(id);

    storyObject._ids.to.push(id);
    state.id = id;

    return [state, storyObject]
};

const option = ({state, storyObject, operands}) => {
    let additional;
    try {
        if (operands.indexOf("{") + 1) {
            const reResult = /\{(\{.+\})\}/.exec(operands);
            additional = JSON.parse(reResult[1]);
            operands = operands.split(/\{\{.+\}\}/).join("");
        }
    } catch (e) {
        e.message = 'In additional data: ' + e.name
        throw e
    }

    let [next,  ...title] = operands.split(" ").filter(_ => !!_);
    next = trnslt(next);
    title = title.join(" ");

    state.scene = state.scene || {};
    state.scene.options = state.scene.options || [];
    const obj = {title, next}

    if(additional){
        Object.assign(obj, additional)
    }

    state.scene.options.push(obj);


    if(next.length < 3) throw new Error("Too short id");

    storyObject._ids.from.push(next);

    return [state, storyObject]
};

const next = ({state, storyObject, operands}) => {
    let next = operands.split(" ");//todo: условные переходы
    const id = trnslt(next.pop());
    next.push(id);

    if(next.length === 1) next = next[0];

    if(state.scene && state.scene.next){
        state.scene.next.push(next)
    }else{
        state.scene = state.scene || {};
        state.scene.next = [next];
    }

    if(id.length < 3) throw new Error("Too short id");

    storyObject._ids.from.push(id);

    return [state, storyObject]
};

const scene = ({state, storyObject, operands}) => {
    const scene = JSON.parse(operands);

    state.scene = Object.assign({}, state.scene || {}, scene);

    return [state, storyObject]
};

const char = ({state, storyObject, operands}) => {
    let additional={};
    try {
        if (operands.indexOf("{") + 1) {
            const reResult = /\{(\{.+\})\}/.exec(operands);
            additional = JSON.parse(reResult[1]);
            operands = operands.split(/\{\{.+\}\}/).join("");
        }
    } catch (e) {
        e.message = 'In additional data: ' + e.name
        throw e
    }

    const isAcqu = /(^| )default($| )/m.test(operands);
    operands = operands.split(/(?:^| )default(?:$| )/).join(" ");

    let [charId, ...name] = operands.split(" ");
    charId = trnslt(charId);

    storyObject.script.characters[charId] = {name: name.join(' ')}

    const defaultExt = additional.defaultExt || 'png';
    const defaultSprite = additional.defaultSprite || 'index'
    const defaultSpriteFile = [defaultSprite, defaultExt].join('.')

    storyObject.assets = storyObject.assets || {};
    storyObject.assets.characters = storyObject.assets.characters || {}
    storyObject.assets.characters[charId] = storyObject.assets.characters[charId] || [defaultSpriteFile];

    if (isAcqu || storyObject.knownCharsByDefault)
        storyObject.defaultGameState.acquaintance[charId] = true;

    return [state, storyObject]
};

const checkpointName = ({state, storyObject, operands}) => {
    let [id, ...title] = operands.split(" ");
    id = trnslt(id);

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

        let additional;
        try {
            if (operands.indexOf("{") + 1) {
                const jsonReResult = /\{(\{.+\})\}/.exec(operands);
                additional = JSON.parse(jsonReResult[1]);
                operands = operands.split(/\{\{.+\}\}/).join("");
            }
        } catch (e) {
            e.message = 'In additional data: ' + e.name
            throw e
        }

        const reResult = /\[([^\]]+)\]/.exec(operands);
        let tags = undefined;
        if(reResult){
            tags = reResult[1].split(" ").filter(_ => !!_);
            operands = operands.split(/\[(?:[^\]]+)\]/).join("");
        }

        const isDefault = /(^| )default($| )/m.test(operands);
        operands = operands.split(/(?:^| )default(?:$| )/).join(" ");
        let [name, ...title] = operands.split(" ").filter(_ => !!_);
        name = trnslt(name);

        let index = storyObject.script.wardrobe.findIndex((value) => value.name === wardrobeSet);
        if (index === -1) {
            index = storyObject.script.wardrobe.push({name: wardrobeSet, set: []}) - 1;
        }
        title = title.filter(_ => !!_).join(" ");

        const obj = {
            name,
            tags,
            title: title
        }

        if(additional){
            Object.assign(obj, additional)
        }

        storyObject.script.wardrobe[index].set.push(obj);

        if (isDefault) {
            storyObject.defaultGameState.userLook[wardrobeSet] = name;
        }

        return [state, storyObject]
    };
}

const nation = makeWardrobeFields("nation")
const hair = makeWardrobeFields("hair")
const clothes = makeWardrobeFields("clothes")
const item = makeWardrobeFields("item")

const end = ({state, storyObject, operands}) => {
    state.scene = Object.assign({}, state.scene, {next: null})

    return [state, storyObject]
};


const addition = ({state, storyObject, operands}) => {
    storyObject = Object.assign({}, storyObject, JSON.parse(operands));

    return [state, storyObject]
};

const defReplica = (state, replica) => {
    if(replica.length === 0){
        return null;
    }
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
    item,
    "вещь": item,
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
    end,
    "конец": end,
    addition,
    "допдата": addition,
    defReplica,

}
