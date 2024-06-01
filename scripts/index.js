document.addEventListener("DOMContentLoaded", function () {
    getUser();
    handleBoxClicks();
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
    categorizeDrivers(groupedByName)
    const localGroupedByName = checkAndRemoveDrivers({ ...groupedByName });
    

    renderDataToHtml(driverCounts, localGroupedByName);
}

function checkAndRemoveDrivers(dados) {
    for (const driverName in dados) {
        const routers = dados[driverName];
        let shouldRemove = false;
        for (const cafID in routers) {
            const routerKeys = Object.keys(routers[cafID]);
            for (const routerKey of routerKeys) {
                const firstLetter = routerKey.charAt(0).toUpperCase();
                if (firstLetter === 'W' || firstLetter === 'L' || firstLetter === 'V' || firstLetter === 'S' || firstLetter === 'Q' || firstLetter === 'N') {
                    shouldRemove = true;
                    break;
                }
            }
            if (shouldRemove) {
                break;
            }
        }
        if (shouldRemove) {
            delete dados[driverName];
        }
    }
    return dados;
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
function categorizeDrivers(data) {
    // Define the categories
    const metropolitanas = ["EUS", "AQU", "HOR", "PCJ", "ITA", "MRC", "MA1", "MA2", "MR1", "MR2", "CA1", "CA2", "PCT"];
    const interior = ["S", "V", "W", "L", "Q", "N"];

    // Initialize count variables for each category
    let metropolitanasCount = 0;
    let interiorCount = 0;
    let localCount = 0;
    
    // Initialize count variables for CAFs in each category
    let metropolitanasCountCaf = 0;
    let interiorCountCaf = 0;
    let localCountCaf = 0;

    // Loop through the data object
    for (const driverName in data) {
        const driverData = data[driverName];
        // Initialize sets for unique CAFs for each driver
        const driverCafs = new Set();
        for (const cafID in driverData) {
            driverCafs.add(cafID);
            const seenRouters = new Set();
            for (const router in driverData[cafID]) {
                if (!seenRouters.has(router)) {
                    const category = router.substring(0, 3);
                    if (metropolitanas.includes(category)) {
                        metropolitanasCount += driverData[cafID][router];
                        metropolitanasCountCaf++;
                    } else if (interior.some(prefix => router.startsWith(prefix))) {
                        interiorCount += driverData[cafID][router];
                        interiorCountCaf++;
                    } else {
                        localCount += driverData[cafID][router];
                        localCountCaf++;
                    }
                    seenRouters.add(router);
                }
            }
        }
    }

    // Update DOM elements with counts
    document.querySelector(".locCaf").value = localCountCaf;
    document.querySelector(".metCaf").value = metropolitanasCountCaf;
    document.querySelector(".intCaf").value = interiorCountCaf;
    document.querySelector(".locRout").value = localCount;
    document.querySelector(".metRout").value = metropolitanasCount;
    document.querySelector(".intRout").value = interiorCount;
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
        const [router, cafID, driverName] = line.split('\t');
        return {router, cafID, driverName };
    });
}
function renderDataToHtml(driverCounts, groupedByName) {
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
            cafSpan.innerHTML = `CAF: ${caf} <span class="QTD"> | TOTAL: ${cafCount} |</span>`;

            // Adicionando os routers
            const routers = cafs[caf];
            for (const router in routers) {
                const routerSpan = document.createElement("span");
                routerSpan.classList.add("routerCaf");
                routerSpan.innerHTML = `${router} : ${routers[router]}`;
                cafSpan.appendChild(routerSpan);
            }

            cafDiv.appendChild(cafSpan);
            driverDiv.appendChild(cafDiv);
        }

        secElement.appendChild(driverDiv);
    });

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

    generateImage();
}
function generateImage() {
    const content = document.querySelector('.sec');
    const scale = 3;  // Ajuste a escala conforme necessário para melhorar a qualidade

    const options = {
        width: content.offsetWidth * scale,
        height: content.offsetHeight * scale,
        style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
        }
    };

    domtoimage.toPng(content, options)
        .then(function (dataUrl) {
            // Cria uma nova imagem e define o URL da imagem como a imagem capturada
            const image = new Image();
            image.src = dataUrl;
            image.style.width = `${content.offsetWidth}px`;
            image.style.height = `${content.offsetHeight}px`;

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
function handleBoxClicks() {
    const mainBoxes = document.querySelectorAll('.mainBox');

    if (mainBoxes.length === 0) {
        console.error("No .mainBox elements found!");
        return;
    }

    mainBoxes.forEach(mainBox => {
        const icon = mainBox.querySelector('.icon.iconOpen');

        if (!icon) {
            console.error("Icon with class .icon.iconOpen not found inside .mainBox!");
            return;
        }

        // Initialize the icon display to ensure a known value
        icon.style.display = 'none';

        mainBox.addEventListener('click', () => {
            console.log("Hi, you clicked on a mainBox!");

            if (icon.style.display === 'flex') {
                icon.style.display = 'none';
            } else {
                icon.style.display = 'flex';
            }
        });
    });
}

