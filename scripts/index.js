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

    const filter = document.querySelector(".collectSelectType")
    
    if(filter.value === "typeSelectDriver") {
        setMessage(collections)
        typeDriverData(collections)
    }else if(filter.value === "typeSelectRouter"){
        setMessage(collections)
        typeRouterData(collections)
    }else{
        return console.error("Invalid invalid data.")
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
    const { dados: localGroupedByName, removedDrivers } = checkAndRemoveDrivers({ ...groupedByName });
    renderDataToHtml(driverCounts, localGroupedByName);
    renderDataToHtml2(driverCounts, removedDrivers); // Render removed drivers in table2
}
function typeRouterData(collections){
    const items = processDataRouter(collections);
    if (!items || items.length === 0) {
        console.error("No items processed.");
        return;
    }
    const groupedByRouter = groupCafsAndNameByRouters(items);
    categorizeDrivers(groupedByRouter)
    const { groupedByRouter: localGroupedByRouter, removedRouters } = checkAndRemoveRouter({ ...groupedByRouter });

    const sortedGroupedByRouter = sortObjectByKey(localGroupedByRouter);

    renderDataToHtmlRouter(sortedGroupedByRouter, items);
    renderDataToHtmlRouter2(removedRouters, items); // Render removed routers in table2
}
function sortObjectByKey(obj) {
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});
}
function checkAndRemoveDrivers(dados) {
    const invalidPrefixes = ['W', 'L', 'V', 'S', 'Q', 'N'];
    const removedDrivers = {};

    for (const driverName in dados) {
        const routers = dados[driverName];
        for (const cafID in routers) {
            if (Object.keys(routers[cafID]).some(routerKey => invalidPrefixes.includes(routerKey.charAt(0).toUpperCase()))) {
                removedDrivers[driverName] = routers;
                delete dados[driverName];
                break;
            }
        }
    }
    return { dados, removedDrivers };
}
function checkAndRemoveRouter(groupedByRouter) {
    const interiorPrefixes = ["S", "V", "W", "L", "Q", "N"];
    const removedRouters = {};

    for (const router in groupedByRouter) {
        if (interiorPrefixes.some(prefix => router.startsWith(prefix))) {
            removedRouters[router] = groupedByRouter[router];
            delete groupedByRouter[router];
        }
    }
    return { groupedByRouter, removedRouters };
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
function categorizeDrivers(data) {
    const metropolitanas = ["EUS", "AQU", "HOR", "PCJ", "ITA", "MRC", "MA1", "MA2", "MR1", "MR2", "CA1", "CA2", "PCT"];
    const interior = ["S", "V", "W", "L", "Q", "N"];

    const counts = { metropolitanasCount: 0, interiorCount: 0, localCount: 0 };
    const countsCaf = { metropolitanasCountCaf: 0, interiorCountCaf: 0, localCountCaf: 0 };

    for (const driverName in data) {
        for (const cafID in data[driverName]) {
            for (const router in data[driverName][cafID]) {
                const category = router.substring(0, 3);
                if (metropolitanas.includes(category)) {
                    counts.metropolitanasCount += data[driverName][cafID][router];
                    countsCaf.metropolitanasCountCaf++;
                } else if (interior.some(prefix => router.startsWith(prefix))) {
                    counts.interiorCount += data[driverName][cafID][router];
                    countsCaf.interiorCountCaf++;
                } else {
                    counts.localCount += data[driverName][cafID][router];
                    countsCaf.localCountCaf++;
                }
            }
        }
    }

    document.querySelector(".locCaf").value = countsCaf.localCountCaf;
    document.querySelector(".metCaf").value = countsCaf.metropolitanasCountCaf;
    document.querySelector(".intCaf").value = countsCaf.interiorCountCaf;
    document.querySelector(".locRout").value = counts.localCount;
    document.querySelector(".metRout").value = counts.metropolitanasCount;
    document.querySelector(".intRout").value = counts.interiorCount;
}
function groupCafsAndRoutersByName(items) {
    return items.reduce((grouped, { driverName, cafID, router }) => {
        const routerMatch = router.match(/\[(.*?)\]/);
        const routerName = routerMatch ? routerMatch[1] : null;
        if (!routerName) return grouped;

        if (!grouped[driverName]) grouped[driverName] = {};
        if (!grouped[driverName][cafID]) grouped[driverName][cafID] = {};
        if (!grouped[driverName][cafID][routerName]) grouped[driverName][cafID][routerName] = 0;
        grouped[driverName][cafID][routerName]++;
        return grouped;
    }, {});
}
function groupCafsAndNameByRouters(items) {
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
            let totalCount = 0;
            for (const router in cafData[name]) {
                totalCount += cafData[name][router];
            }
            if (totalCount > maxCount || (totalCount === maxCount && !maxRouter)) {
                maxRouter = Object.keys(cafData[name]).reduce((a, b) => cafData[name][a] > cafData[name][b] ? a : b);
                maxCount = totalCount;
            }
        }

        if (!groupedByRouter[maxRouter]) {
            groupedByRouter[maxRouter] = {};
        }

        for (const name in cafData) {
            if (!groupedByRouter[maxRouter][name]) {
                groupedByRouter[maxRouter][name] = {};
            }
            groupedByRouter[maxRouter][name][caf] = maxCount;
        }
    }

    return groupedByRouter;
}
function changeCollect(){
    const changeTitleCollect = document.querySelector(".changeTitleCollect")
    const filter = document.querySelector(".collectSelectType")
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
    const secElement = document.querySelector(".table .sec");
    const leftBox = document.querySelector(".table .leftBox");
    const rightBox = document.querySelector(".table .rightBox");

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

    const cafInput = document.querySelector(".table .cafsCount");
    const cardsInput = document.querySelector(".table .cardsCount");

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
function renderDataToHtml2(driverCounts, groupedByName) {
    const secElement = document.querySelector(".table2 .sec");
    const leftBox = document.querySelector(".table2 .leftBox");
    const rightBox = document.querySelector(".table2 .rightBox");

    // Limpar qualquer conteúdo existente
    leftBox.innerHTML = '';
    rightBox.innerHTML = '';

    // Ordenar os motoristas alfabeticamente
    const sortedDrivers = Object.keys(groupedByName).sort();

    // Dividir os motoristas entre as caixas esquerda e direita
    const middleIndex = Math.ceil(sortedDrivers.length / 2);
    const leftDrivers = sortedDrivers.slice(0, middleIndex);
    const rightDrivers = sortedDrivers.slice(middleIndex);

    let totalPieces = 0; // Inicializar a contagem total de peças

    function renderDrivers(drivers, container) {
        drivers.forEach(driverName => {
            const driverDiv = document.createElement("div");
            driverDiv.classList.add("driver");

            const driverNameSpan = document.createElement("div");
            driverNameSpan.classList.add("driverName");
            driverNameSpan.innerHTML = `<span>${driverName}</span><span class="QTD QTD3">QTD:${driverCounts[driverName] || 0}</span>`;
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
                    routerSpan.innerHTML = `${router} = ${routers[router]}`;
                    cafSpan.appendChild(routerSpan);
                }

                cafDiv.appendChild(cafSpan);
                driverDiv.appendChild(cafDiv);

                totalPieces += cafCount; // Incrementar a contagem total de peças
            }

            container.appendChild(driverDiv);
        });
    }

    renderDrivers(leftDrivers, leftBox);
    renderDrivers(rightDrivers, rightBox);

    const totalCafs = document.querySelectorAll('.table2 .caf').length;
    document.querySelector(".table2 .cafsCount").value = totalCafs;
    document.querySelector(".table2 .cardsCount").value = totalPieces; // Usar a contagem correta de peças

    generateImageInt(); // Atualizar a imagem
}
function renderDataToHtmlRouter(groupedByRouter, items) {
    const leftBox = document.querySelector(".table .leftBox");
    const rightBox = document.querySelector(".table .rightBox");

    // Limpar qualquer conteúdo existente
    leftBox.innerHTML = '';
    rightBox.innerHTML = '';

    function renderRouter(router, container) {
        const routerDiv = document.createElement("div");
        routerDiv.classList.add("driver");

        const driverNameDiv = document.createElement("div");
        driverNameDiv.classList.add("driverName");
        driverNameDiv.innerHTML = `<span>${router}</span><span class="QTD QTD3">QTD: ${getRouterTotal(router)}</span>`;
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

                // Procurar o objeto correspondente em items
                const item = items.find(item => item.cafID === caf);
                const formattedDate = item ? item.lastDate.split(' ')[0] : '';
                const total = groupedByRouter[router][driver][caf];

                cafDiv.innerHTML = `<span class="lastDate">(${formattedDate})</span> ${caf} = ${total} `;
                driverDiv.appendChild(cafDiv);
            }

            routerDiv.appendChild(driverDiv);
        }

        container.appendChild(routerDiv);
    }

    function getRouterTotal(router) {
        let total = 0;
        for (const driver in groupedByRouter[router]) {
            for (const caf in groupedByRouter[router][driver]) {
                total += groupedByRouter[router][driver][caf];
            }
        }
        return total;
    }

    const routers = Object.keys(groupedByRouter);
    const middleIndex = Math.ceil(routers.length / 2);
    const leftRouters = routers.slice(0, middleIndex);
    const rightRouters = routers.slice(middleIndex);

    leftRouters.forEach(router => renderRouter(router, leftBox));
    rightRouters.forEach(router => renderRouter(router, rightBox));

    const cafInput = document.querySelector(".table .cafsCount");
    const cardsInput = document.querySelector(".table .cardsCount");

    let totalCafs = 0;
    let totalPieces = 0;

    // Iterar sobre cada rota, motorista e caf para calcular os totais
    for (const router in groupedByRouter) {
        for (const driver in groupedByRouter[router]) {
            for (const caf in groupedByRouter[router][driver]) {
                totalCafs++; // Incrementar o total de cafs
                totalPieces += groupedByRouter[router][driver][caf]; // Somar a quantidade de peças
            }
        }
    }

    // Atribuir os totais aos campos de entrada
    cafInput.value = totalCafs;
    cardsInput.value = totalPieces;

    generateImage();
}
function renderDataToHtmlRouter2(groupedByRouter, items) {
    const leftBox = document.querySelector(".table2 .leftBox");
    const rightBox = document.querySelector(".table2 .rightBox");

    // Limpar qualquer conteúdo existente
    leftBox.innerHTML = '';
    rightBox.innerHTML = '';

    function renderRouter(router, container) {
        const routerDiv = document.createElement("div");
        routerDiv.classList.add("driver");

        const driverNameDiv = document.createElement("div");
        driverNameDiv.classList.add("driverName");
        driverNameDiv.innerHTML = `<span>${router}</span><span class="QTD QTD3">QTD: ${getRouterTotal(router)}</span>`;
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

                // Procurar o objeto correspondente em items
                const item = items.find(item => item.cafID === caf);
                const formattedDate = item ? item.lastDate.split(' ')[0] : '';
                const total = groupedByRouter[router][driver][caf];

                cafDiv.innerHTML = `<span class="lastDate">(${formattedDate})</span> ${caf} = ${total} `;
                driverDiv.appendChild(cafDiv);
            }

            routerDiv.appendChild(driverDiv);
        }

        container.appendChild(routerDiv);
    }

    function getRouterTotal(router) {
        let total = 0;
        for (const driver in groupedByRouter[router]) {
            for (const caf in groupedByRouter[router][driver]) {
                total += groupedByRouter[router][driver][caf];
            }
        }
        return total;
    }

    const routers = Object.keys(groupedByRouter);
    const middleIndex = Math.ceil(routers.length / 2);
    const leftRouters = routers.slice(0, middleIndex);
    const rightRouters = routers.slice(middleIndex);

    leftRouters.forEach(router => renderRouter(router, leftBox));
    rightRouters.forEach(router => renderRouter(router, rightBox));

    const cafInput = document.querySelector(".table2 .cafsCount");
    const cardsInput = document.querySelector(".table2 .cardsCount");

    let totalCafs = 0;
    let totalPieces = 0;

    // Iterar sobre cada rota, motorista e caf para calcular os totais
    for (const router in groupedByRouter) {
        for (const driver in groupedByRouter[router]) {
            for (const caf in groupedByRouter[router][driver]) {
                totalCafs++; // Incrementar o total de cafs
                totalPieces += groupedByRouter[router][driver][caf]; // Somar a quantidade de peças
            }
        }
    }

    // Atribuir os totais aos campos de entrada
    cafInput.value = totalCafs;
    cardsInput.value = totalPieces;

    generateImageInt(); // Atualizar a imagem
}
function generateImage() {
    const content = document.querySelector('.table .sec');
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
            const downloadButton = document.querySelector('.table .buttonDn button');
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
function generateImageInt() {
    const content = document.querySelector('.table2 .sec');
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
            const downloadButton = document.querySelector('.table2 .buttonDn button');
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

function setMessage(itemList) {
    // Formata a lista de itens
    const itens = formatList(itemList);

    // Separa os itens em "Interior" e "Não Interior"
    const { naoInterior, interior } = filterAndSeparateItems(itens);

    // Quantidade de cafIDs únicos para Não Interior
    const quantidadeCafIDsNaoInterior = countUniqueCafIDs(naoInterior);
    // Quantidade total de routers para Não Interior
    const quantidadeRoutersNaoInterior = naoInterior.length;

    // Quantidade de cafIDs únicos para Interior
    const quantidadeCafIDsInterior = countUniqueCafIDs(interior);
    // Quantidade total de routers para Interior
    const quantidadeRoutersInterior = interior.length;

    // Transformar rotas de Interior
    const rotasInterior = transformInteriorRoutes(interior);

    // Obtém a data atual
    const dataAtual = new Date().toLocaleDateString();

    const user = document.querySelector(".nameUser").value;

    // Constrói a mensagem HTML de forma mais organizada
    const mensagemHTML = `
        <div class="msg">
            <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                Boa noite,
                *Caf's de cards feitas pelo 3° turno*

                Hoje (*${dataAtual}*), foram feitas *${quantidadeCafIDsNaoInterior}* caf's, movimentado 
                *${quantidadeRoutersNaoInterior}* cartões para serem expedidos.

                Interior foram feitos *${rotasInterior}*, sendo *${quantidadeCafIDsInterior}* caf's,
                movimentando um total de *${quantidadeRoutersInterior}* cartões.

                ~${user}.
            </span>
            <span class="copy" style="position: absolute;">Copiado</span>
        </div>
    `;

    // Seleciona o elemento onde você deseja inserir a mensagem
    const mensagemContainer = document.querySelector(".msg");

    // Insere a mensagem HTML dentro do elemento selecionado
    if (mensagemContainer) {
        mensagemContainer.innerHTML = mensagemHTML;
    } else {
        console.error("Elemento .msg não encontrado para inserir a mensagem.");
    }
}


function filterAndSeparateItems(itemList) {
    const naoInterior = [];
    const interior = [];

    const letrasIndesejadas = ['W', 'L', 'V', 'S', 'Q', 'N'];

    // Itera sobre cada item da lista
    itemList.forEach(item => {
        const router = item.router;
        
        // Encontra o valor dentro dos colchetes no router
        const regexResult = router.match(/\[(.*?)\]/);
        if (!regexResult) {
            interior.push(item); // Se não encontrar valor dentro dos colchetes, considera como Interior
            return;
        }
        
        const valorDentroColchetes = regexResult[1];

        // Verifica se o router começa com as letras indesejadas ou se não tem valor dentro dos colchetes
        if (letrasIndesejadas.some(letra => valorDentroColchetes.startsWith(letra)) || !valorDentroColchetes) {
            interior.push(item);
        } else {
            item.routerValor = valorDentroColchetes; // Adiciona o valor dentro dos colchetes ao item
            naoInterior.push(item);
        }
    });

    return { naoInterior, interior };
}
function transformInteriorRoutes(interiorList) {
    const transformMap = {
        'W': 'Oeste',
        'L': 'Leste',
        'S': 'Serra',
        'V': 'Vale',
        'Q': 'Quixada',
        'N': 'New'
    };

    const transformedRoutes = new Set();

    interiorList.forEach(item => {
        const router = item.router;
        const regexResult = router.match(/\[(.*?)\]/);
        if (regexResult) {
            const valorDentroColchetes = regexResult[1];
            const initialLetter = valorDentroColchetes.charAt(0);
            if (transformMap[initialLetter]) {
                transformedRoutes.add(transformMap[initialLetter]);
            }
        }
    });

    return Array.from(transformedRoutes).join(' | ');
}



function formatList(inputList) {
    return inputList.map(item => {
        let parts = item.split('\t');

        // Verifica se há exatamente 4 partes e remove a terceira
        if (parts.length === 4) {
            parts.splice(2, 1);
        }

        // Cria um objeto com as propriedades router, cafID e driverName
        return {
            router: parts[0],
            cafID: parts[1],
            driverName: parts[2]
        };
    });
}

function countUniqueCafIDs(itemList) {
    const cafIDsSet = new Set(itemList.map(item => item.cafID));

    return cafIDsSet.size;
}


