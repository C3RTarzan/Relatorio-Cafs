document.addEventListener("DOMContentLoaded", function () {
    getUser();
});

function getData() {
    const collectionsElement = document.querySelector(".collections");

    if (!collectionsElement) {
        console.error("Element with class 'collections' not found.");
        return;
    }

    const collections = collectionsElement.value.trim().split('\n');
    if (collections.length === 0) {
        console.error("No data found in the 'collections' element.");
        return;
    }

    const items = processData(collections);
    if (!items || items.length === 0) {
        console.error("No items processed.");
        return;
    }

    const driverCounts = countDriverNames(items);
    const groupedByName = groupCafsAndRoutersByName(items);

    console.log(groupedByName);

    renderDataToHtml(driverCounts, groupedByName, items);
}
function countDriverNames(items) {
    const driverCounts = {};

    items.forEach(item => {
        const driverName = item.driverName;
        if (driverName) {
            driverCounts[driverName] = (driverCounts[driverName] || 0) + 1;
        }
    });

    return driverCounts;
}
function sortObjectByKey(obj) {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
}
function groupCafsAndRoutersByName(items) {
    const groupedByName = {};

    items.forEach(item => {
        const name = item.driverName;
        const caf = item.cafID;
        const routerMatch = item.router.match(/\[(.*?)\]/);
        const router = routerMatch ? routerMatch[1] : null;

        if (!router) {
            console.warn("Router format unexpected:", item.router);
            return;
        }

        if (!groupedByName[name]) {
            groupedByName[name] = {};
        }

        if (!groupedByName[name][caf]) {
            groupedByName[name][caf] = {};
        }

        if (!groupedByName[name][caf][router]) {
            groupedByName[name][caf][router] = 0;
        }

        groupedByName[name][caf][router]++;
    });

    return groupedByName;
}
function processData(collections) {
    return collections.map(line => {
        const [userID, router, cafID, driverName] = line.split('\t');
        return { userID, router, cafID, driverName };
    });
}
function renderDataToHtml(driverCounts, groupedByName, items) {
    console.log(items);
    const secElement = document.querySelector(".sec");
    secElement.innerHTML = ''; // Limpar qualquer conteúdo existente

    // Ordenar os motoristas alfabeticamente
    const sortedDrivers = Object.keys(groupedByName).sort();

    // Iterar sobre os motoristas ordenados
    sortedDrivers.forEach(driverName => {
        const driverDiv = document.createElement("div");
        driverDiv.classList.add("driver");

        const driverNameSpan = document.createElement("span");
        driverNameSpan.classList.add("driverName");
        driverNameSpan.innerHTML = `${driverName} <span class="QTD QTD3"> | QTD: ${driverCounts[driverName] || 0} | </span>`;
        driverDiv.appendChild(driverNameSpan);

        const cafs = groupedByName[driverName];

        for (const caf in cafs) {
            const cafDiv = document.createElement("div");
            cafDiv.classList.add("caf");

            const cafCount = Object.values(cafs[caf]).reduce((a, b) => a + b, 0);
            const cafSpan = document.createElement("span");
            cafSpan.classList.add("driverCaf");
            cafSpan.innerHTML = `CAF: ${caf} <span class="QTD"> | QTD: ${cafCount} |</span>`;

            // Encontrar o userId correspondente ao caf atual
            const userId = items.find(item => item.cafID === caf)?.userID;
            if (userId) {
                const userIdSpan = document.createElement("span");
                userIdSpan.classList.add("userId");
                userIdSpan.innerHTML = ` | ID: ${userId} | `;
                cafSpan.appendChild(userIdSpan);
            }

            cafSpan.innerHTML += `<iconify-icon class="icon iconOpen" icon="mdi:checkbox-blank-outline"></iconify-icon>`;
            cafDiv.appendChild(cafSpan);

            const routers = cafs[caf];

            for (const router in routers) {
                const routerDiv = document.createElement("div");
                routerDiv.classList.add("router");

                const routerSpan = document.createElement("span");
                routerSpan.classList.add("driverRouter");
                routerSpan.innerHTML = `${router} <span class="QTD QTD2"> | QTD: ${routers[router]} |</span>`;
                routerDiv.appendChild(routerSpan);

                cafDiv.appendChild(routerDiv);
            }

            driverDiv.appendChild(cafDiv);
        }

        secElement.appendChild(driverDiv);
    });

    // Atualizar a seção de rodapé
    const cafInput = document.querySelector(".cafsCount");
    const cardsInput = document.querySelector(".cardsCount");

    let totalCafs = 0;
    let totalRouters = 0;

    sortedDrivers.forEach(driverName => {
        const cafs = groupedByName[driverName];
        for (const caf in cafs) {
            totalCafs++;
            for (const router in cafs[caf]) {
                totalRouters += cafs[caf][router];
            }
        }
    });

    cafInput.value = totalCafs;
    cardsInput.value = totalRouters;

    generateImage()
}
function generateImage() {
    const content = document.querySelector('.sec');
    domtoimage.toPng(content)
        .then(function (dataUrl) {
            // Cria uma nova imagem e define o URL da imagem como a imagem capturada
            const image = new Image();
            image.src = dataUrl;

            // Substitui completamente o conteúdo pelo elemento da imagem
            content.innerHTML = '';
            content.appendChild(image);
        })
        .catch(function (error) {
            console.error('Ocorreu um erro ao gerar a imagem:', error);
        });
}






function configOpen() {
    
}
function addUser() {
    const user = document.querySelector(".userADD").value.trim()
    const userMat = document.querySelector(".userADDMat").value.trim()
    let userName = localStorage.getItem("User");
    let listUser
    if (userName) {
        listUser = userName + ', ' + user + ' | ' + userMat
    } else {
        listUser = user + ' | ' + userMat
    }
    if (user.length > 0) {
        localStorage.setItem("User", listUser)
        getUser()
        getName()
    }
}
function getUser() {
    const userName = localStorage.getItem("User");
    const listaNomesContainer = document.querySelector(".config .namesUsers");
    listaNomesContainer.innerHTML = ''
    if (userName) {

        const listNames = userName.split(", ");
        listNames.sort();

        listNames.forEach(function (name) {
            const divElement = document.createElement("div");

            const spanElement = document.createElement("span");
            spanElement.textContent = name;

            const iconElement = document.createElement("iconify-icon");
            iconElement.className = "iconDelet";
            iconElement.onclick = function () {
                deletUser(name);
            };
            iconElement.setAttribute("icon", "jam:delete-f");

            divElement.appendChild(spanElement);
            divElement.appendChild(iconElement);

            listaNomesContainer.appendChild(divElement);
        });
    }
}
function deletUser(user) {
    const userName = localStorage.getItem("User");
    const listNames = userName.split(", ");

    const indexToDelete = listNames.indexOf(user);

    if (indexToDelete !== -1) {
        listNames.splice(indexToDelete, 1);

        localStorage.setItem("User", listNames.join(", "));

        getUser()
        getName()
    }
}
function getName() {
    //localStorage.setItem("Username", "Alan H. Silva, Natali alguma coisa, Ailson ferreira");
    const userName = localStorage.getItem("User");

    const listNames = userName.split(", ");

    listNames.sort();

    const selectElement = document.querySelector(".collectSelectName");

    const optionsToRemove = Array.from(selectElement.children).filter(option => option.value !== "0");
    optionsToRemove.forEach(option => selectElement.removeChild(option));

    if (userName) {
        listNames.forEach(function (name, index) {
            const newOption = document.createElement("option");
            newOption.value = index + 1;
            newOption.text = name.trim();
            selectElement.add(newOption);
        });
    }
}
function copy() {
    const msgcopy = document.querySelector('.textcopy')
    const copy = document.querySelector('.copy')
    const msg = msgcopy



    const elementoTextCopy = msg.textContent.replace(/^\s+/gm, '').replace(/br/g, '\n');

    navigator.clipboard.writeText(elementoTextCopy)
        .then(() => {
            copy.style.display = 'flex'
            setTimeout(function () {
                copy.style.display = 'none'
            }, 500)
        })
        .catch((err) => {
            // Ocorreu um erro ao copiar o texto
            console.error('Erro ao copiar o texto:', err);
        });
}
