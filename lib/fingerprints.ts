export type Fingerprint = {
    name: string;

    patterns: {
        value: string;
        weight: number;
        type: string;
    }[];

    cooperation: boolean;

    confidence: number;
};


export const fingerprints: Fingerprint[] = [


    // ==========================================
    // 已合作平台
    // ==========================================


    {
        name: "gogoshop",

        patterns: [

            {
                value: "img.gogoshop.cloud",
                weight: 10,
                type: "CDN"
            },

            {
                value: "gogoshop.cloud",
                weight: 8,
                type: "CDN"
            },

            {
                value: "gogoshop",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 95
    },


    {
        name: "WACA",

        patterns: [

            {
                value: "waca.net",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "waca",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 90
    },


    {
        name: "EasyStore",

        patterns: [

            {
                value: "easystore.co",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "easystore",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 90
    },


    {
        name: "QDM",

        patterns: [

            {
                value: "qdm.tw",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "qdm",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 90
    },


    {
        name: "showmore",

        patterns: [

            {
                value: "showmore",
                weight: 8,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 85
    },


    {
        name: "尚峪",

        patterns: [

            {
                value: "shangyu",
                weight: 8,
                type: "HTML"
            },

            {
                value: "sunny",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 85
    },


    {
        name: "開店123",

        patterns: [

            {
                value: "shop123",
                weight: 8,
                type: "HTML"
            },

            {
                value: "開店123",
                weight: 8,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 85
    },


    {
        name: "Liteshop",

        patterns: [

            {
                value: "liteshop",
                weight: 8,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 85
    },


    {
        name: "環匯亞太",

        patterns: [

            {
                value: "worldpay",
                weight: 8,
                type: "HTML"
            },

            {
                value: "globalpay",
                weight: 8,
                type: "HTML"
            }

        ],

        cooperation: true,

        confidence: 85
    },



    // ==========================================
    // 市場常見平台
    // ==========================================


    {
        name: "SHOPLINE",

        patterns: [

            {
                value: "shoplineapp.com",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "shoplineimg.com",
                weight: 10,
                type: "CDN"
            },

            {
                value: "shopline",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: false,

        confidence: 95
    },


    {
        name: "Shopify",

        patterns: [

            {
                value: "cdn.shopify.com",
                weight: 10,
                type: "CDN"
            },

            {
                value: "shopify.com",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "shopify",
                weight: 5,
                type: "HTML"
            }

        ],

        cooperation: false,

        confidence: 95
    },


    {
        name: "91APP",

        patterns: [

            {
                value: "91app.com",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "91app",
                weight: 8,
                type: "HTML"
            }

        ],

        cooperation: false,

        confidence: 90
    },


    {
        name: "Cyberbiz",

        patterns: [

            {
                value: "cyberbiz.co",
                weight: 10,
                type: "DOMAIN"
            },

            {
                value: "cyberbiz",
                weight: 8,
                type: "HTML"
            }

        ],

        cooperation: false,

        confidence: 90
    },


    {
        name: "WooCommerce",

        patterns: [

            {
                value: "woocommerce",
                weight: 8,
                type: "HTML"
            },

            {
                value: "wc-cart-fragments",
                weight: 10,
                type: "HTML"
            }

        ],

        cooperation: false,

        confidence: 90
    },


    {
        name: "Magento",

        patterns: [

            {
                value: "magento",
                weight: 8,
                type: "HTML"
            },

            {
                value: "mage",
                weight: 3,
                type: "HTML"
            }

        ],

        cooperation: false,

        confidence: 80
    }

];