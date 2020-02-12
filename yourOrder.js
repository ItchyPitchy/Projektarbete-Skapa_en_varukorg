$(document).ready(function() {
    $.getJSON("dataBase.json", function(productList) {
        const $table = $('tbody');
        const cartArr = JSON.parse(localStorage.getItem('cartArr'));
        let totalCost = 0;

        for(let i = 0; i < cartArr.length; i++) {
            const imgUrl = getProductInfo(cartArr[i].product).img;

            totalCost += cartArr[i].price;
            $table.append(
                `<tr>
                    <td class ="fruitImg"><img src="${imgUrl}"></td>
                    <td>${cartArr[i].product}</td>
                    <td>${cartArr[i].quantity} st</td>
                    <td>${cartArr[i].price} kr</td>
                </tr>`
            );
        };
        $('span').html(`Totalt: ${totalCost} kr`);

        $('button').click(function() {
            localStorage.setItem('cartArr', '[]');
        });

        function getProductInfo(targetProduct) {
            return productList.find(element => element.product === targetProduct);
        };
    });
});