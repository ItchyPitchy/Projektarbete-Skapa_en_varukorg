$(document).ready(function () {
    $.getJSON("dataBase.json", function (productList) {
        for (let i = 0; i < productList.length; i++) { // Loopar ut alla etiketter med respektive produkt, hämtade från json-filen (productList)
            const $etiquetteHolder = $("#etiquette-wrapper");

            $etiquetteHolder.append(
                `<li class="card">
                    <img class="image" src="${productList[i].img}">
                    <div class="card-body">
                        <h3 class="card-title">${productList[i].product}</h3>
                        <p class="card-text">${productList[i].price} kr</p>
                        <input class="inputQuant" type="number" min="1" value="1">
                        <button class="addBtn btn btn-primary">Lägg till</button>
                    </div>
                </li>`
            );
        };
        if (localStorage.getItem("cartArr") === null) {
            localStorage.setItem("cartArr", "[]");
        } else {
            createCart(); // ritar ut varukorgen i HTML:n utifrån localStorage
        };

        $(".addBtn").click(function () { // lägger click-event på alla "Lägg-till"-knappar
            addToCart(this);
        });

        $("#toggle-cart-btn").click(function () {
            $(".cart").slideToggle(800);
        });

        $("#emptyCartBtn").click(function () {
            localStorage.setItem("cartArr", "[]");
            createCart(); // ritar ut varukorgen i HTML:n utifrån localStorage
        });

        $(".inputQuant").on("input", function () { // lägger input-event på alla input-fält
            const $inputField = $(this); // $(this) konverterar input-elementet till jQuery-element så vi kan använda jQuery-metoder 
            const $price = $inputField.siblings("p");
            const product = $inputField.siblings("h3").text();
            const unitPrice = getProductInfo(product).price;

            if ($inputField.val() === "" || $inputField.val() < 1) {
                $inputField.val("1");
            };
            $price.text(`${$inputField.val() * unitPrice} kr`); // ändra priset utifrån antalet i input-fältet
        });

        function addToCart(addBtn) { // Lägger till en produktbeställning i localStorage
            const $inputField = $(addBtn).siblings("input");
            const $priceElement = $(addBtn).siblings("p");
            const qty = parseInt($inputField.val());
            const product = $(addBtn).siblings("h3").text();
            const price = getProductInfo(product).price * qty;
            const cartArr = JSON.parse(localStorage.getItem("cartArr")); // hämta nuvarande localStorage

            if (duplicateExists(cartArr, product)) { // om den hittar en produkt-dublett
                if (confirm("Vill du ersätta? OK=ERSÄTT  AVBRYT=LÄGG IHOP")) {
                    replaceProduct(cartArr, product, qty, price); // ersätt den nya produktbeställningen med den gamla, i localStorage
                    createCart() // rita ut varukorgen utifrån localStorage
                    showMessage("Produkten har lagts till i varukorgen.", "success");
                } else {
                    mergeProduct(cartArr, product, qty, price); // lägg ihop dem i localStorage
                    createCart() // rita ut varukorgen utifrån localStorage
                    showMessage("Produkten har lagts till i varukorgen.", "success");
                };
            } else { // om det inte finns en produktdublett
                cartArr.unshift({ quantity: qty, product: product, price: price });
                localStorage.setItem("cartArr", JSON.stringify(cartArr));
                createCart(); // rita ut varukorgen utifrån localStorage
                showMessage("Produkten har lagts till i varukorgen.", "success");
            };
            $inputField.val(1) // ändra tillbaks input-value till 1
            $priceElement.text(`${getProductInfo(product).price} kr`) // ändra tillbaka priset till styck-priset
        };

        function showMessage(message, className) { // Lägger till popup message
            $('table').before(`<div class="alert alert-${className}">${message}</div>`);
            const $alertElement = $('.alert');

            setTimeout(() => $alertElement.remove(), 2000); // ta bort meddelande-elementet efter 3 sekunder
        };

        function createCart() { // Skapar varukorgen i HTML utifrån localStorage
            const cartArr = JSON.parse(localStorage.getItem("cartArr"));
            const $cart = $("#cart-items-holder");
            let content = "";
            let totalCost = 0;

            for (let i = 0; i < cartArr.length; i++) { // lägger ihop alla produktbeställningar
                content += `<tr><td class="product">${cartArr[i].product}</td><td>`;
                if (cartArr[i].quantity !== 1) { // om antalet inte är 1
                    content += '<button class="decrease">-</button>'; // lägg också till decrease-knappen
                };
                content +=
                            `<span>${cartArr[i].quantity}</span>
                            <button class="increase">+</button>
                        </td>
                        <td>${cartArr[i].price} kr</td>
                        <td>
                            <button class="dltBtn btn btn-danger btn-sx delete">Ta bort</button>
                        </td>
                    </tr>`;
                totalCost += cartArr[i].price; // lägger ihop kostnaden
            };
            $("#total").text("Totalt:" + " " + totalCost + " kr");
            $cart.html(content);

            $(".decrease").click(function () { // lägger click-event på alla decrease-knappen
                const $btn = $(this);
                const product = $btn.parent().prev().text();
                const newQty = parseInt($btn.next().text()) - 1;
                const newPrice = newQty * getProductInfo(product).price;

                replaceProduct(cartArr, product, newQty, newPrice); // ersätter gamla beställningen med nya (den med antalet och priset ändrat)
                createCart(); // ritar ut varukorgen i HTML utifrån localStorage
            });

            $(".increase").click(function () { // lägger click-event på alla increase-knappar
                const $btn = $(this);
                const product = $btn.parent().prev().text();
                const newQty = parseInt($btn.prev().text()) + 1;
                const newPrice = newQty * getProductInfo(product).price;

                replaceProduct(cartArr, product, newQty, newPrice); // ersätter gamla beställningen med nya (den med antalet och priset ändrat)
                createCart(); // ritar ut varukorgen i HTML utifrån localStorage
            });

            $(".dltBtn").click(function () { // lägger click-event på alla delete-knappar
                const targetProduct = $(this).parent().siblings('.product').text();

                deleteItem(cartArr, targetProduct); // tar bort produktbeställningen från localStorage
                createCart(); // ritar ut varukorgen i HTML utifrån localStorage
            });
        };

        function duplicateExists(cartArr, targetProduct) {  // Kollar om en produkt redan finns i localStorage
            return cartArr.find(element => element.product === targetProduct); // Returnerar truthy eller falsy
        };

        function replaceProduct(cartArr, targetProduct, newQty, newPrice) { // Ersätter en produktbeställning med den nya, i localStorage
            cartArr.forEach((element, index) => {
                if (element.product === targetProduct) {
                    cartArr.splice(index, 1, { quantity: newQty, product: targetProduct, price: newPrice }); // ta bort produkten ur varukorgen och ersätt med nya
                };
            });
            localStorage.setItem("cartArr", JSON.stringify(cartArr));
        };

        function mergeProduct(cartArr, targetProduct, newQty, newPrice) { // Slår ihop två produktbeställningar i localStorage
            cartArr.forEach((element, index) => {
                if (element.product === targetProduct) {
                    const qtySum = newQty + element.quantity; // addera antalen
                    const priceSum = newPrice + element.price; // och addera prisen
                    cartArr.splice(index, 1, { quantity: qtySum, product: targetProduct, price: priceSum }); // Ta bort produkten ur varukorgen och ersätt det med de nya värdena
                };
            });
            localStorage.setItem("cartArr", JSON.stringify(cartArr));
        };

        function deleteItem(cartArr, targetProduct) { // Delete from local storage
            cartArr.forEach((element, index) => {
                if (element.product === targetProduct) {
                    cartArr.splice(index, 1); // ta bort produktbeställningen från arrayen
                };
            });
            localStorage.setItem("cartArr", JSON.stringify(cartArr));
        };

        function getProductInfo(targetProduct) { // Hämtar produktinfo från JSON-filen
            return productList.find(element => element.product === targetProduct);
        };
    });
});