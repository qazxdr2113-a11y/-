export function generateRecommendation(
    platform:string,
    score:number
){


if(score>=80){


    if(platform==="SHOPLINE"){

        return "使用 SHOPLINE 建置電商，具備成熟購物流程，建議以全支付導入、多元支付及會員導流方案切入。";

    }



    if(platform==="Shopify"){


        return "使用 Shopify 平台，可能具備品牌電商或跨境需求，建議強調支付整合便利性與會員流量價值。";

    }



    return "網站具備高度開發潛力，建議優先聯繫並了解目前支付需求。";

}




if(score>=50){


    return "具備電商基礎，建議確認目前付款方式及營運規模後進一步評估。";


}



return "目前資訊不足，建議持續觀察或補充網站資料。";


}