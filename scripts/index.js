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
    const typeCollections = collections.map(str => str.split('\t'))[0].length;
    const selectElement = document.querySelector('select[name="collect"]');
    if(typeCollections === 3){
        selectElement.value = 'typeSelectDriver';
        changeCollect()
    }else if(typeCollections === 4){
        selectElement.value = 'typeSelectRouter';
        changeCollect()
    }else{
        console.error("Check the data passed, only data with 3 rows (Route ID of the cafe Driver's Name) and 4 (Route ID of the cafe Date/Time Registration Status Driver's Name) are valid.");
        return
    }

    const filter = document.querySelector(".collectSelect")
    if(filter.value === "typeSelectDriver") {
        typeDriverData(collections)
    }else if(filter.value === "typeSelectRouter"){
        typeRouterData(collections)
    }
    
}
function typeDriverData(collections){

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
function typeRouterData(collections){
    const items = processDataRouter(collections);
    if (!items || items.length === 0) {
        console.error("No items processed.");
        return;
    }
    const groupedByRouter = groupCafsAndNameByRouters(items);
    categorizeDrivers(groupedByRouter)
    const localGroupedByRouter = checkAndRemoveRouter({ ...groupedByRouter });

    const sortedGroupedByRouter = sortObjectByKey(localGroupedByRouter);

    renderDataToHtmlRouter(sortedGroupedByRouter, items);
}
function sortObjectByKey(obj) {
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});
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
function checkAndRemoveRouter(groupedByRouter) {
    const metropolitanas = ["EUS", "AQU", "HOR", "PCJ", "ITA", "MRC", "MA1", "MA2", "MR1", "MR2", "CA1", "CA2", "PCT"];
    const interior = ["S", "V", "W", "L", "Q", "N"];

    for (const router in groupedByRouter) {
        // Verificar se a rota é uma metropolitana
        if (metropolitanas.includes(router)) {
            delete groupedByRouter[router];
        } else {
            // Verificar se a rota é uma rota interior
            for (const prefix of interior) {
                if (router.startsWith(prefix)) {
                    delete groupedByRouter[router];
                    break;
                }
            }
        }
    }

    return groupedByRouter;
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
function groupCafsAndNameByRouters(items){
    const groupedByCaf = {};

    items.forEach(item => { 
        const name = item.driverName;
        const caf = item.cafID;
        const routerMatch = item.router.match(/\[(.*?)\]/);
        const router = routerMatch ? routerMatch[1] : null;
        if (!router) {
            console.warn("Router format unexpected:", item.router);
            return;
        }
        
        if (!groupedByCaf[caf]) {
            groupedByCaf[caf] = {};
        }

        if (!groupedByCaf[caf][name]) {
            groupedByCaf[caf][name] = {};
        }

        if (!groupedByCaf[caf][name][router]) {
            groupedByCaf[caf][name][router] = 0;
        }

        groupedByCaf[caf][name][router]++;
    });

    const groupedByRouter = {};

    for (const caf in groupedByCaf) {
        const cafData = groupedByCaf[caf];
        let maxRouter = null;
        let maxCount = 0;

        for (const name in cafData) {
            for (const router in cafData[name]) {
                if (cafData[name][router] > maxCount || (cafData[name][router] === maxCount && !maxRouter)) {
                    maxRouter = router;
                    maxCount = cafData[name][router];
                }
            }
        }

        if (!groupedByRouter[maxRouter]) {
            groupedByRouter[maxRouter] = {};
        }

        for (const name in cafData) {
            if (!groupedByRouter[maxRouter][name]) {
                groupedByRouter[maxRouter][name] = {};
            }
            groupedByRouter[maxRouter][name][caf] = cafData[name][maxRouter];
        }
    }

    return groupedByRouter;
}
function changeCollect(){
    const changeTitleCollect = document.querySelector(".changeTitleCollect")
    const filter = document.querySelector(".collectSelect")
    if(filter.value === "typeSelectDriver") {
        changeTitleCollect.innerHTML = "Rota | ID Caf | Motorista"
    }else if(filter.value === "typeSelectRouter"){
        changeTitleCollect.innerHTML = "Rota | ID Caf | Data/Hora R. S. | Motorista"
    }
}
function processData(collections) {
    return collections.map(line => {
        const [router, cafID, driverName] = line.split('\t');
        return { router, cafID, driverName };
    });
}
function processDataRouter(collections) {
    return collections.map(line => {
        const [router, cafID, lastDate, driverName] = line.split('\t');
        return { router, cafID, lastDate, driverName };
    });
}
function renderDataToHtml(driverCounts, groupedByName) {
    const secElement = document.querySelector(".sec");
    const leftBox = document.querySelector(".leftBox");
    const rightBox = document.querySelector(".rightBox");

    // Limpar qualquer conteúdo existente
    leftBox.innerHTML = '';
    rightBox.innerHTML = '';

    // Ordenar os motoristas alfabeticamente
    const sortedDrivers = Object.keys(groupedByName).sort();

    // Dividir os motoristas entre as caixas esquerda e direita
    const middleIndex = Math.ceil(sortedDrivers.length / 2);
    const leftDrivers = sortedDrivers.slice(0, middleIndex);
    const rightDrivers = sortedDrivers.slice(middleIndex);

    function renderDrivers(drivers, container) {
        drivers.forEach(driverName => {
            const driverDiv = document.createElement("div");
            driverDiv.classList.add("driver");

            const driverNameSpan = document.createElement("div");
            driverNameSpan.classList.add("driverName");
            driverNameSpan.innerHTML = `<span>${driverName}</span><span class="QTD QTD3">QTD:${driverCounts[driverName] || 0}</span>`
            //driverNameSpan.innerHTML = `${driverName} <span class="QTD QTD3"> |QTD:${driverCounts[driverName] || 0}| </span>`;
            driverDiv.appendChild(driverNameSpan);

            const cafs = groupedByName[driverName];

            for (const caf in cafs) {
                const cafDiv = document.createElement("div");
                cafDiv.classList.add("caf");

                const cafCount = Object.values(cafs[caf]).reduce((a, b) => a + b, 0);
                const cafSpan = document.createElement("span");
                cafSpan.classList.add("driverCaf");
                cafSpan.innerHTML = `CAF: <span class="valueCaf">${caf}</span> <span class="QTD"> | TOTAL: ${cafCount} |</span>`;

                // Adicionando os routers
                const routers = cafs[caf];
                for (const router in routers) {
                    const routerSpan = document.createElement("span");
                    routerSpan.classList.add("routerCaf");
                    routerSpan.innerHTML = `${router}:${routers[router]}`;
                    cafSpan.appendChild(routerSpan);
                }

                cafDiv.appendChild(cafSpan);
                driverDiv.appendChild(cafDiv);
            }

            container.appendChild(driverDiv);
        });
    }

    // Renderizar motoristas na caixa da esquerda
    renderDrivers(leftDrivers, leftBox);

    // Renderizar motoristas na caixa da direita
    renderDrivers(rightDrivers, rightBox);

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
function renderDataToHtmlRouter(groupedByRouter, items) {
    const leftBox = document.querySelector(".leftBox");
    const rightBox = document.querySelector(".rightBox");

    // Limpar qualquer conteúdo existente
    leftBox.innerHTML = '';
    rightBox.innerHTML = '';

    function renderRouter(router, container) {
        const routerDiv = document.createElement("div");
        routerDiv.classList.add("driver");

        const driverNameDiv = document.createElement("div");
        driverNameDiv.classList.add("driverName");
        driverNameDiv.innerHTML = `<span>${router}</span><span class="QTD QTD3">QTD: ${getRouterTotal(groupedByRouter[router])}</span>`;
        routerDiv.appendChild(driverNameDiv);

        for (const driver in groupedByRouter[router]) {
            const driverDiv = document.createElement("div");
            driverDiv.classList.add("caf");

            const driverNameSpan = document.createElement("span");
            driverNameSpan.classList.add("valueCaf");
            driverNameSpan.textContent = driver;
            driverDiv.appendChild(driverNameSpan);

            for (const caf in groupedByRouter[router][driver]) {
                const cafDiv = document.createElement("span");
                cafDiv.classList.add("routerCaf");
                const total = groupedByRouter[router][driver][caf];

                // Procurar o objeto correspondente em items
                const item = items.find(item => item.cafID === caf);
                const formattedDate = item.lastDate.split(' ')[0];

                cafDiv.innerHTML = `<span class="lastDate">(${formattedDate})</span> ${caf} = ${total} `;
                driverDiv.appendChild(cafDiv);
            }

            routerDiv.appendChild(driverDiv);
        }

        container.appendChild(routerDiv);
    }

    function getRouterTotal(drivers) {
        let total = 0;
        for (const driver in drivers) {
            total += getTotal(drivers[driver]);
        }
        return total;
    }

    function getTotal(caf) {
        let total = 0;
        for (const router in caf) {
            total += caf[router];
        }
        return total;
    }

    const routers = Object.keys(groupedByRouter);
    const middleIndex = Math.ceil(routers.length / 2);
    const leftRouters = routers.slice(0, middleIndex);
    const rightRouters = routers.slice(middleIndex);

    leftRouters.forEach(router => renderRouter(router, leftBox));
    rightRouters.forEach(router => renderRouter(router, rightBox));

    const cafInput = document.querySelector(".cafsCount");
    const cardsInput = document.querySelector(".cardsCount");

    let totalCafs = 0;
    let totalPieces = 0;

    // Iterar sobre cada rota, motorista e caf para calcular os totais
    for (const router in groupedByRouter) {
        for (const driver in groupedByRouter[router]) {
            for (const caf in groupedByRouter[router][driver]) {
                totalCafs++; // Incrementar o total de cafs
                // Adicionar o valor de caf diretamente ao total de peças
                totalPieces += groupedByRouter[router][driver][caf]; // Somar a quantidade de peças
            }
        }
    }

    // Atribuir os totais aos campos de entrada
    cafInput.value = totalCafs;
    cardsInput.value = totalPieces;

    generateImage();
}
function generateImage() {
    const content = document.querySelector('.sec');
    const scale = 4;  // Ajuste a escala conforme necessário para melhorar a qualidade
    const a4Width = 794;  // Largura da folha A4 em pixels a 96 DPI
    const a4Height = 1123;  // Altura da folha A4 em pixels a 96 DPI

    // Ajustar o tamanho do conteúdo para caber em uma folha A4
    const contentWidth = content.offsetWidth;
    const contentHeight = content.offsetHeight;
    const widthRatio = a4Width / contentWidth;
    const heightRatio = a4Height / contentHeight;
    const fitScale = Math.min(widthRatio, heightRatio);

    const options = {
        width: contentWidth * fitScale * scale,
        height: contentHeight * fitScale * scale,
        style: {
            transform: `scale(${fitScale * scale})`,
            transformOrigin: 'top left',
            width: `${contentWidth}px`,
            height: `${contentHeight}px`,
        }
    };

    domtoimage.toPng(content, options)
        .then(function (dataUrl) {
            // Habilita o botão de download e define a ação de download
            const downloadButton = document.querySelector('.buttonDn button');
            downloadButton.disabled = false;
            downloadButton.onclick = function () {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = 'image.png';
                link.click();
            };
        })
        .catch(function (error) {
            console.error('Ocorreu um erro ao gerar a imagem:', error);
        });
}
function showBox(clickedCheckbox) {
    const checkboxes = document.querySelectorAll('input[name="checkbox"]');
    checkboxes.forEach((checkbox) => {
        if (checkbox !== clickedCheckbox) {
            checkbox.checked = false;
        }
    });
}
function configOpen() {
    const config = document.querySelector(".config")
    if (window.getComputedStyle(config).top === "-600px") {
        config.style = "top: auto";
    } else {
        config.style = "top: -600px";
    }
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

