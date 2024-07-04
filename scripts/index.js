document.addEventListener("DOMContentLoaded", function () {
    getUser();
});
function getData() {
    setTitle()

    const collectionsElement = document.querySelector(".collections");
    const collectionsBackLogElement = document.querySelector(".collectionsBackLog");

    if (!collectionsElement) {
        errorHandling("Element with class 'collections' not found.")
        return;
    }

    const collections = collectionsElement.value.trim().split('\n');
    const collectionsBackLog = collectionsBackLogElement ? collectionsBackLogElement.value.trim().split('\n') : [];

    if (collections.length === 0) {
        errorHandling("No data found in the 'collections' element.");
        return;
    }
    const typeCollections = collections.map(str => str.split('\t'))[0].length;
    const typeCollectionsBackLog = collectionsBackLog.map(str => str.split('\t'))[0].length;
    

    if(typeCollections !== 3 && typeCollectionsBackLog !== 4){
        
        return errorHandling("Os campos 'Hoje' ou 'Backlog' devem estar preenchidos.");
    }
    const filter = document.querySelector(".collectSelectType")

    const backlogCheckbox = document.querySelector("#checkBoxBackLog");
    let backlog = backlogCheckbox.checked;

    if (!backlog) {
        setMessage(collections, collectionsBackLog);
    } else if (backlog && typeCollectionsBackLog === 4) {
        setMessageBackLog(collectionsBackLog);
    } else {
        backlog = false;
        backlogCheckbox.checked = false;
        setMessage(collections, collectionsBackLog);

        errorHandling("Invalid invalid data.")
    }

    if(filter.value === "typeSelectDriver") {
        typeDriverData(collections, collectionsBackLog)
    }else if(filter.value === "typeSelectRouter"){
        typeRouterData(collections, collectionsBackLog)
    }else{
        return errorHandling("Invalid invalid data.") 
    }
    
}
function typeDriverData(collections, collectionsBackLog) {
    const items = processData(collections);
    if (!items || items.length === 0) {
        errorHandling("No items processed.");
        return;
    }

    const driverCounts = countDriverNames(items);
    const groupedByName = groupCafsAndRoutersByName(items);
    categorizeDrivers(groupedByName);

    const { dados: localGroupedByName, removedDrivers } = checkAndRemoveDrivers({ ...groupedByName });
    renderDataToHtml(driverCounts, localGroupedByName);
    renderDataToHtml2(driverCounts, removedDrivers); // Render removed drivers in table2

    const dateBackLog = document.querySelector(".dateBackLog .collectionsBackLog").value;
    if (dateBackLog.length !== 0 || dateBackLog !== "") {
        const itemsRouter = processData(collections);
        if (!itemsRouter || itemsRouter.length === 0) {
            errorHandling("No items processed.");
            return;
        }

        const groupedByRouterRouter = groupCafsAndNameByRouters(itemsRouter);
        categorizeDrivers(groupedByRouterRouter);
        const { groupedByRouter: localGroupedByRouterRouter } = checkAndRemoveRouter({ ...groupedByRouterRouter });
        const sortedGroupedByRouterRouter = sortObjectByKey(localGroupedByRouterRouter);

        const itemsBackLog = processDataRouter(collectionsBackLog);
        if (!itemsBackLog || itemsBackLog.length === 0) {
            errorHandling("No items processed.");
            return;
        }

        const groupedByRouter = groupCafsAndNameByRouters(itemsBackLog);
        categorizeDrivers(groupedByRouter);
        const { groupedByRouter: localGroupedByRouter } = checkAndRemoveRouter({ ...groupedByRouter });
        renderDataToHtml3(driverCounts, localGroupedByName, localGroupedByRouter, itemsBackLog, sortedGroupedByRouterRouter);
    } else {
        const secElement = document.querySelector(".table3");
        secElement.style.display = 'none';
    }
}
function typeRouterData(collections, collectionsBackLog) {
    const items = processData(collections);
    if (!items || items.length === 0) {
        errorHandling("No items processed.");
        return;
    }

    const groupedByRouter = groupCafsAndNameByRouters(items);
    categorizeDrivers(groupedByRouter);
    const { groupedByRouter: localGroupedByRouter, removedRouters } = checkAndRemoveRouter({ ...groupedByRouter });
    const sortedGroupedByRouter = sortObjectByKey(localGroupedByRouter);
    renderDataToHtmlRouter(sortedGroupedByRouter);
    renderDataToHtmlRouter2(removedRouters); // Render removed routers in table2

    const dateBackLog = document.querySelector(".dateBackLog .collectionsBackLog").value;
    if (dateBackLog.length !== 0 || dateBackLog !== "") {
        const itemsBackLog = processDataRouter(collectionsBackLog);
        if (!itemsBackLog || itemsBackLog.length === 0) {
            errorHandling("No items processed.");
            return;
        }

        const groupedByRouterBackLog = groupCafsAndNameByRouters(itemsBackLog);
        categorizeDrivers(groupedByRouterBackLog);
        const { groupedByRouter: localGroupedByRouterBackLog } = checkAndRemoveRouter({ ...groupedByRouterBackLog });
        const sortedGroupedByRouterBackLog = sortObjectByKey(localGroupedByRouterBackLog);
        renderDataToHtmlRouter3(sortedGroupedByRouter, sortedGroupedByRouterBackLog, itemsBackLog);
    } else {
        const secElement = document.querySelector(".table3");
        secElement.style.display = 'none';
    }
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

    generateImage("table");
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
                    routerSpan.innerHTML = `${router}:${routers[router]}`;
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

    generateImage("table2"); // Atualizar a imagem
}
function renderDataToHtml3(driverCounts, groupedByName, localGroupedByRouter, itemsBakcLog, sortedGroupedByRouterBackLogRouter) {
    const secElement = document.querySelector(".table3");
    secElement.style.display = 'flex';
    const leftBox = secElement.querySelector(".sec .leftBox");
    const rightBox = secElement.querySelector(".sec .rightBox");

    renderDataToHtml3BackLog(localGroupedByRouter, itemsBakcLog, sortedGroupedByRouterBackLogRouter)

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
                    routerSpan.innerHTML = `${router}:${routers[router]}`;
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

    for (const router in  localGroupedByRouter) {
        for (const driver in localGroupedByRouter[router]) {
            for (const caf in localGroupedByRouter[router][driver]) {
                totalPieces += localGroupedByRouter[router][driver][caf]; // Somar a quantidade de peças
            }
        }
    } 

    const totalCafs = document.querySelectorAll('.table3 .caf').length;

    document.querySelector(".table3 .cafsCount").value = totalCafs;
    document.querySelector(".table3 .cardsCount").value = totalPieces; 

    generateImage("table3"); // Atualizar a imagem
}
function renderDataToHtml3BackLog(groupedByRouter, items) {
    const leftBox = document.querySelector(".table3 .sec2 .leftBox");
    const rightBox = document.querySelector(".table3 .sec2 .rightBox");

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
            //driverNameSpan.textContent = driver;
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
}
function renderDataToHtmlRouter(groupedByRouter) {
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
                const total = groupedByRouter[router][driver][caf];

                cafDiv.innerHTML = `${caf} = ${total} `;
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

    generateImage("table");
}
function renderDataToHtmlRouter2(groupedByRouter) {
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
                const total = groupedByRouter[router][driver][caf];

                cafDiv.innerHTML = `${caf} = ${total} `;
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

    generateImage("table2"); // Atualizar a imagem
}
function renderDataToHtmlRouter3(groupedByRouter, groupedByRouterBackLog, itemsBackLog) {
    const secElement = document.querySelector(".table3");
    secElement.style.display = 'flex';
    const leftBox = secElement.querySelector(".sec .leftBox");
    const rightBox = secElement.querySelector(".sec .rightBox");

    renderDataToHtmlRouter3BackLog(groupedByRouterBackLog, itemsBackLog)

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
                const total = groupedByRouter[router][driver][caf];

                cafDiv.innerHTML = `${caf} = ${total} `;
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

    const cafInput = document.querySelector(".table3 .cafsCount");
    const cardsInput = document.querySelector(".table3 .cardsCount");

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

    for (const router in groupedByRouterBackLog) {
        for (const driver in groupedByRouterBackLog[router]) {
            for (const caf in groupedByRouterBackLog[router][driver]) {
                totalCafs++; // Incrementar o total de cafs
                totalPieces += groupedByRouterBackLog[router][driver][caf]; // Somar a quantidade de peças
            }
        }
    }

    // Atribuir os totais aos campos de entrada
    cafInput.value = totalCafs;
    cardsInput.value = totalPieces;

    generateImage("table3");
}
function renderDataToHtmlRouter3BackLog(groupedByRouter, items) {
    const leftBox = document.querySelector(".table3 .sec2 .leftBox");
    const rightBox = document.querySelector(".table3 .sec2 .rightBox");

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
            //driverDiv.appendChild(driverNameSpan);

            for (const caf in groupedByRouter[router][driver]) {
                const cafDiv = document.createElement("span");
                cafDiv.classList.add("routerCaf");

                // Procurar o objeto correspondente em items
                const total = groupedByRouter[router][driver][caf];
                const item = items.find(item => item.cafID === caf);
                const formattedDate = item ? item.lastDate.split(' ')[0] : '';

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
}
async function generateImage(className) {
    const content = document.querySelector(`.${className}`);
    const button = content.querySelector('.buttonDn');
    const header = content.querySelector('.header');
    const sec = content.querySelector('.sec');
    const sec2 = content.querySelector('.sec2');
    const BgTitle = content.querySelector('.BgTitle');
    const footer = content.querySelector('.footer');

    // Store the original styles
    const originalStyles = {
        buttonDisplay: button.style.display,
        header: {
            width: header.style.width,
            padding: header.style.padding,
        },
        sec: {
            width: sec.style.width,
            padding: sec.style.padding,
        },
        sec2: sec2 ? {
            width: sec2.style.width,
            padding: sec2.style.padding,
        } : null,
        BgTitle: BgTitle ? {
            width: BgTitle.style.width,
            padding: BgTitle.style.padding,
        } : null,
        footer: {
            width: footer.style.width,
            padding: footer.style.padding,
        },
        contentPadding: content.style.padding
    };

    // Hide the button and adjust the width of elements
    button.style.display = "none";
    [header, sec, footer].forEach(element => {
        element.style.width = "100%";
        element.style.padding = "0";
    });
    if (sec2) {
        sec2.style.width = "100%";
        sec2.style.padding = "0";
        BgTitle.style.width = "100%";
        BgTitle.style.padding = "0";      
    }
    content.style.padding = "0";

    const scale = 4;  // Adjust the scale as necessary to improve quality
    const a4Width = 794;  // A4 sheet width in pixels at 96 DPI
    const a4Height = 1123;  // A4 sheet height in pixels at 96 DPI

    // Adjust content size to fit an A4 sheet
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

    try {
        const dataUrl = await domtoimage.toPng(content, options);

        // Restore the original styles
        button.style.display = originalStyles.buttonDisplay;
        header.style.width = originalStyles.header.width;
        header.style.padding = originalStyles.header.padding;
        sec.style.width = originalStyles.sec.width;
        sec.style.padding = originalStyles.sec.padding;
        if (sec2) {
            sec2.style.width = originalStyles.sec2.width;
            sec2.style.padding = originalStyles.sec2.padding;
            BgTitle.style.width = originalStyles.BgTitle.width;
            BgTitle.style.padding = originalStyles.BgTitle.padding;   
        }
        footer.style.width = originalStyles.footer.width;
        footer.style.padding = originalStyles.footer.padding;
        content.style.padding = originalStyles.contentPadding;

        // Enable the download button and set the download action
        const downloadButton = content.querySelector('.buttonDn button');
        downloadButton.disabled = false;
        downloadButton.onclick = function () {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'RelatórioCaf.png';
            link.click();
        };
    } catch (error) {
        // Restore the button if an error occurs
        button.style.display = "flex";
        errorHandling('An error occurred while generating the image', error);
    }
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
            errorHandling('Erro ao copiar o texto ', err)
        });
}
function handleBoxClicks() {
    const mainBoxes = document.querySelectorAll('.mainBox');

    if (mainBoxes.length === 0) {
        return errorHandling("No .mainBox elements found!");;
    }

    mainBoxes.forEach(mainBox => {
        const icon = mainBox.querySelector('.icon.iconOpen');

        if (!icon) {
            return errorHandling("Icon with class .icon.iconOpen not found inside .mainBox!");
        }

        // Initialize the icon display to ensure a known value
        icon.style.display = 'none';

        mainBox.addEventListener('click', () => {
            if (icon.style.display === 'flex') {
                icon.style.display = 'none';
            } else {
                icon.style.display = 'flex';
            }
        });
    });
}
function setMessage(itemList, itemListBackLog) {

    defineTable(false)
    // Creating message variable
    let mensagemHTML

    // Select from the shift
    const shift = responsibleData("collectShift")
    const data = responsibleData("collectLPDOrCard")
    
    // Format the item lists
    const itens = formatList(itemList);
    const itensBackLog = formatList(itemListBackLog)

    // Create message BackLog
    let messagePriority = ''
    if(itemListBackLog[0] !== ''){
        messagePriority = getDelayedCafs(itemListBackLog)
    }

    // separate countryside from not countryside 
    const { notCountryside, countryside } = filterAndSeparateItems(itens);
    const { notCountryside: notCountrysideBackLog } = filterAndSeparateItems(itensBackLog);
    

    // Total amount of Caf
    const amountCafNotCountryside = countUniqueCafIDs(notCountryside);
    const amountCafNotCountrysideBackLog = countUniqueCafIDs(notCountrysideBackLog);
    
    // Total amount of Router
    const amountRoutersNotCountryside = notCountryside.length;
    const amountRoutersNotCountrysideBackLog = notCountrysideBackLog.length;

    // // Amount of Countryside
    let amountCafCountryside
    let amountRoutersCountryside
    if (countryside.length > 0 && !countryside[0].router && countryside[0].cafID === undefined && countryside[0].driverName === undefined) {
        amountCafCountryside = 0
        amountRoutersCountryside = 0
    }else{
        amountCafCountryside = countUniqueCafIDs(countryside);
        amountRoutersCountryside = countryside.length;
    }

    // Transform routes Countryside
    const RouterCountryside = transformInteriorRoutes(countryside);

    // Gets the current date
    const currentDate = new Date().toLocaleDateString();


    const user = document.querySelector(".nameUser").value;


    // Builds the HTML message in a more organized way
    const typeItensBackLog = itemListBackLog.map(str => str.split('\t'))[0].length;

    if(typeItensBackLog === 4){
        mensagemHTML = `
        <div class="msg">
            <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                *Caf's de ${data} feitas pelo ${shift}° turno*<span style="display: none;">br</span>

                Hoje (*${currentDate}*), foram feitas *${amountCafNotCountryside}* caf's, movimentado 
                *${amountRoutersNotCountryside}* volumes para serem expedidos.<span style="display: none;">br</span>

                Interior foram feitos *${RouterCountryside}*, sendo *${amountCafCountryside}* caf's,
                movimentando um total de *${amountRoutersCountryside}* volumes.<span style="display: none;">br</span>

                *BackLog de CARDS.*<span style="display: none;">br</span>

                Temos um total de *${amountCafNotCountrysideBackLog}* caf's, movimentado 
                *${amountRoutersNotCountrysideBackLog}* volumes para serem expedidos com prioridade.<span style="display: none;">br</span>

                ${messagePriority}

                @Maria @Janaína @Emanuel @Emanuel @Wagner @Wellington<span style="display: none;">br</span>

                ~${user}.
            </span>
            <span class="copy" style="position: absolute;">Copiado</span>
        </div>
        `;
    }else{
        if(amountCafCountryside > 0){
            mensagemHTML = `
                <div class="msg">
                    <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                        *Caf's de ${data} feitas pelo ${shift}° turno*<span style="display: none;">br</span>
        
                        Hoje (*${currentDate}*), foram feitas *${amountCafNotCountryside}* caf's, movimentado 
                        *${amountRoutersNotCountryside}* volumes para serem expedidos.<span style="display: none;">br</span>
        
                        Interior foram feitos *${RouterCountryside}*, sendo *${amountCafCountryside}* caf's,
                        movimentando um total de *${amountRoutersCountryside}* volumes.<span style="display: none;">br</span>
        
                        @Maria @Janaína @Emanuel @Emanuel @Wagner @Wellington<span style="display: none;">br</span>
        
                        ~${user}.
                    </span>
                    <span class="copy" style="position: absolute;">Copiado</span>
                </div>
            `;
        }else{
            mensagemHTML = `
            <div class="msg">
                <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                    *Caf's de ${data} feitas pelo ${shift}° turno*<span style="display: none;">br</span>
    
                    Hoje (*${currentDate}*), foram feitas *${amountCafNotCountryside}* caf's, movimentado 
                    *${amountRoutersNotCountryside}* volumes para serem expedidos.<span style="display: none;">br</span>
    
                    @Maria @Janaína @Emanuel @Emanuel @Wagner @Wellington<span style="display: none;">br</span>
    
                    ~${user}.
                </span>
                <span class="copy" style="position: absolute;">Copiado</span>
            </div>
        `;
        }
    }

    // Create the message
    const mensagemContainer = document.querySelector(".msg");

    if (mensagemContainer) {
        mensagemContainer.innerHTML = mensagemHTML;
    } else {
        errorHandling("Elemento .msg não encontrado para inserir a mensagem.");
    }
}
function setMessageBackLog(itemList){

    defineTable(true)

    const data = responsibleData("collectLPDOrCard")
    // Formata a lista de itens
    const itens = formatList(itemList);

    // Separa os itens em "Interior" e "Não Interior"
    const { notCountryside } = filterAndSeparateItems(itens);

    // Quantidade de cafIDs únicos para Não Interior
    const quantidadeCafIDsNaoInterior = countUniqueCafIDs(notCountryside);

    // Quantidade total de routers para Não Interior
    const quantidadeRoutersNaoInterior = notCountryside.length;
    
    const user = document.querySelector(".nameUser").value;

    const messagePriority = getDelayedCafs(itemList)

    // Constrói a mensagem HTML de forma mais organizada
    const mensagemHTML = `
        <div class="msg">
            <span class="text textcopy withGraphic" onclick="copy()" style="white-space: pre-line;">
                *BackLog de ${data}.*<span style="display: none;">br</span>

                Temos um total de *${quantidadeCafIDsNaoInterior}* caf's, movimentado 
                *${quantidadeRoutersNaoInterior}* volumes para serem expedidos com prioridade.<span style="display: none;">br</span>

                ${messagePriority}

                @Maria @Janaína @Emanuel @Emanuel @Wagner @Wellington<span style="display: none;">br</span>

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
        errorHandling("Elemento .msg não encontrado para inserir a mensagem.");
    }
}
function filterAndSeparateItems(itemList) {
    const notCountryside = [];
    const countryside = [];

    const letrasIndesejadas = ['W', 'L', 'V', 'S', 'Q', 'N'];

    // Itera sobre cada item da lista
    itemList.forEach(item => {
        const router = item.router;
        
        // Encontra o valor dentro dos colchetes no router
        const regexResult = router.match(/\[(.*?)\]/);
        if (!regexResult) {
            countryside.push(item); // Se não encontrar valor dentro dos colchetes, considera como countryside
            return;
        }
        
        const valorDentroColchetes = regexResult[1];

        // Verifica se o router começa com as letras indesejadas ou se não tem valor dentro dos colchetes
        if (letrasIndesejadas.some(letra => valorDentroColchetes.startsWith(letra)) || !valorDentroColchetes) {
            countryside.push(item);
        } else {
            notCountryside.push(item);
        }
    });

    return { notCountryside, countryside };
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
function BackLogSetImage(className){
    const data = document.querySelector('.dateBackLog textarea').value;
    if(data.length === 0 || data === '') {
        return null;
    }
    
}
function responsibleData(name){
    const data = document.querySelector(`.${name}`);
    return data.value
}
function errorHandling(errMsg, error) { 
    const body = document.querySelector("body");

    const boxBC = document.createElement("div");
    boxBC.classList.add("errorBox");

    const spanErr = document.createElement("span");
    spanErr.classList.add("error");
    spanErr.textContent = errMsg;

    boxBC.appendChild(spanErr);

    body.appendChild(boxBC);

    setTimeout(() => {
        boxBC.remove();
    }, 2000);
    
    if (error) {
        console.error('Ocorreu um erro: ', error);
    }
}
function setTitle(){
    let data = responsibleData("collectLPDOrCard")

    const span = document.querySelector(".tableReport")
    const spanCountryside = document.querySelector(".tableReportCountryside")
    const spanCountrysideBackLog = document.querySelector(".tableReportBackLog")

    if(data === 'Cards'){
        data = "Card's"
    }

    span.innerHTML = `Relatorio ${data} Local / Metropolitano - Caf's`
    spanCountryside.innerHTML = `Relatorio ${data} Interior - Caf's`
    spanCountrysideBackLog.innerHTML = `Relatorio ${data} - Caf's`
}
function GetPriority(items) {
    let results = [];

    // Process each item in the list
    items.forEach(item => {
        // Split the string based on tabs and spaces
        let parts = item.split(/\t/);
        
        // Extract desired values
        let caf = parts[1]; // CAF
        let datetime = parts[2]; // Date and Time
        
        // Extract only the date (removing the time part)
        let dateOnly = datetime.split(' ')[0]; // '03/06/2024'

        // Store the results in an object, array, or other structure as needed
        results.push({ caf, date: dateOnly });
    });

    return results;
}
function compareDates(a, b) {
    // Convert date strings to Date objects for comparison
    let dateA = new Date(a.date);
    let dateB = new Date(b.date);

    // Compare dates (invert order to show most delayed first)
    if (dateA > dateB) {
        return 1; // a is more recent, so should come after b
    } else if (dateA < dateB) {
        return -1; // b is more recent, so should come after a
    } else {
        return 0; // dates are equal
    }
}
function getDelayedCafs(items) {
    const today = formatDate(new Date()); // Obtém e formata a data atual
    let results = [];

    // Filtra os itens prioritários com datas
    let priorityItems = GetPriority(items);

    // Filtra os itens que estão atrasados (mais de 2 dias)
    let delayedItems = priorityItems.filter(item => {
        let date = item.date;
        let delay = calculateDaysDifference(today, date);
        return delay >= 2; // Apenas datas até hoje e com pelo menos 2 dias de atraso
    });

    // Ordena os itens atrasados por data (mais atrasado primeiro)
    delayedItems.sort(compareDates);

    // Formata os itens atrasados em uma mensagem
    delayedItems.forEach(item => {
        results.push(`CAF: ${item.caf} (${item.date})`);
    });

    let message
    if(results.length === 0){
        message = ""
    }else{
        message = "Dar atenção às Caf's:\n" + results.join("\n");
        message += '<span style="display: none;">br</span>'
    }
    // Junta os resultados com quebra de linha para melhor formatação

    return message;
}
function calculateDaysDifference(date1, date2) {
    // Parse das datas do formato dd/mm/yyyy para objetos Date
    var partsDate1 = date1.split('/');
    var partsDate2 = date2.split('/');
    var dateObj1 = new Date(partsDate1[2], partsDate1[1] - 1, partsDate1[0]);
    var dateObj2 = new Date(partsDate2[2], partsDate2[1] - 1, partsDate2[0]);

    // Calcula a diferença em milissegundos
    var difference = dateObj1.getTime() - dateObj2.getTime();

    // Converte a diferença de milissegundos para dias
    var differenceInDays = Math.floor(difference / (1000 * 60 * 60 * 24));

    return differenceInDays;
}
function formatDate(date) {
    let dd = String(date.getDate()).padStart(2, '0');
    let mm = String(date.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    let yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
function defineTable(value){
    const sec = document.querySelector('.table3 .sec')
    const span = document.querySelector('.table3 .BgTitle')

    if(value){
        sec.style.display = 'none'
        span.style.display = 'none'
    }else{
        sec.style.display = 'flex'
        span.style.display = 'flex'
    }
}





