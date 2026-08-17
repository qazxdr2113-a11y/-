export const platforms = [
    // =========================================
    // GOGOSHOP
    // =========================================
    {
        name: "gogoshop",
        confidence: 95,

        fingerprints: [
            {
                value: "img.gogoshop.cloud",
                weight: 40,
                type: "strong"
            },
            {
                value: "cdn.gogoshop.cloud",
                weight: 40,
                type: "strong"
            },
            {
                value: "gogoshop.cloud",
                weight: 30,
                type: "strong"
            },
            {
                value: "cdn.gogoshop.cloud/_/cache/",
                weight: 20,
                type: "medium"
            },
            {
                value: "gogoshop",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // QDM
    // =========================================
    {
        name: "QDM",
        confidence: 95,

        fingerprints: [
            {
                value: "cdn.qdm.cloud",
                weight: 40,
                type: "strong"
            },
            {
                value: "image-cdn.qdm.cloud",
                weight: 40,
                type: "strong"
            },
            {
                value: "image-cdn-flare.qdm.cloud",
                weight: 40,
                type: "strong"
            },
            {
                value: "qdm_user_uuid",
                weight: 35,
                type: "strong"
            },
            {
                value: "QDMPPID",
                weight: 35,
                type: "strong"
            },
            {
                value: "qdm",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // Easystore
    // =========================================
    {
        name: "Easystore",
        confidence: 95,

        fingerprints: [
            {
                value: "store-themes.easystore.co",
                weight: 40,
                type: "strong"
            },
            {
                value: "apps.easystore.co",
                weight: 40,
                type: "strong"
            },
            {
                value: "resources.easystore.co",
                weight: 40,
                type: "strong"
            },
            {
                value: "easystore-section-header",
                weight: 35,
                type: "strong"
            },
            {
                value: "easystore-section-header-hidden",
                weight: 25,
                type: "medium"
            },
            {
                value: "easystore-section-header-sticky",
                weight: 25,
                type: "medium"
            },
            {
                value: "easystore",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // SHOPLINE
    // =========================================
    {
        name: "SHOPLINE",
        confidence: 95,

        fingerprints: [
            {
                value: "shoplineapp.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "shoplineimg.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "shopline",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // Shopify
    // =========================================
    {
        name: "Shopify",
        confidence: 95,

        fingerprints: [
            {
                value: "cdn.shopify.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "myshopify.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "shopifycdn.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "/cdn/shop/",
                weight: 35,
                type: "strong"
            },
            {
                value: "shopify",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // WooCommerce
    // =========================================
    {
        name: "WooCommerce",
        confidence: 95,

        fingerprints: [
            {
                value: "wp-content/plugins/woocommerce",
                weight: 45,
                type: "strong"
            },
            {
                value: "woocommerce.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "wc-cart-fragments",
                weight: 35,
                type: "strong"
            },
            {
                value: "wc-blocks",
                weight: 30,
                type: "medium"
            },
            {
                value: "woocommerce",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // 91APP
    // =========================================
    {
        name: "91APP",
        confidence: 95,

        fingerprints: [
            {
                value: "91app.com",
                weight: 40,
                type: "strong"
            },
            {
                value: "91app.com.tw",
                weight: 40,
                type: "strong"
            },
            {
                value: "91app",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // Cyberbiz
    // =========================================
    {
        name: "Cyberbiz",
        confidence: 95,

        fingerprints: [
            {
                value: "cyberbiz.co",
                weight: 40,
                type: "strong"
            },
            {
                value: "cyberbiz.com.tw",
                weight: 40,
                type: "strong"
            },
            {
                value: "cyberbiz",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // WACA
    // =========================================
    {
        name: "WACA",
        confidence: 95,

        fingerprints: [
            {
                value: "waca.net",
                weight: 40,
                type: "strong"
            },
            {
                value: "waca.tw",
                weight: 40,
                type: "strong"
            },
            {
                value: "waca",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // Worldpace
    // =========================================
    {
        name: "Worldpace",
        confidence: 95,

        fingerprints: [
            {
                value: "worldpace",
                weight: 30,
                type: "medium"
            }
        ]
    },


    // =========================================
    // 開店123
    // =========================================
    {
        name: "開店123",
        confidence: 90,

        fingerprints: [
            {
                value: "shop123.com.tw",
                weight: 40,
                type: "strong"
            },
            {
                value: "shop123",
                weight: 30,
                type: "medium"
            },
            {
                value: "開店123",
                weight: 20,
                type: "medium"
            }
        ]
    },


    // =========================================
    // Liteshop
    // =========================================
    {
        name: "Liteshop",
        confidence: 90,

        fingerprints: [
            {
                value: "liteshop.com.tw",
                weight: 40,
                type: "strong"
            },
            {
                value: "liteshop",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // showmore
    // =========================================
    {
        name: "showmore",
        confidence: 90,

        fingerprints: [
            {
                value: "showmore.com.tw",
                weight: 40,
                type: "strong"
            },
            {
                value: "showmore",
                weight: 10,
                type: "weak"
            }
        ]
    },


    // =========================================
    // 尚峪
    // =========================================
    {
        name: "尚峪",
        confidence: 90,

        fingerprints: [
            {
                value: "shangyu",
                weight: 30,
                type: "medium"
            },
            {
                value: "尚峪",
                weight: 30,
                type: "medium"
            }
        ]
    },


    // =========================================
    // 環匯亞太
    // =========================================
    {
        name: "環匯亞太",
        confidence: 90,

        fingerprints: [
            {
                value: "環匯亞太",
                weight: 30,
                type: "medium"
            }
        ]
    }
];