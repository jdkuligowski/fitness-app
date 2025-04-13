const min50Workouts = {
    option_a: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Squat Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 30,
            },
        ],
    },
    option_b: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Hinge Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 30,
            },
        ],
    },
    option_c: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 40,
            },
        ],
    },
    option_d: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Squat Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 40,
            },
        ],
    },
    option_e: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Hinge Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 40,
            },
        ],
    },
    option_f: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Squat Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Hamstring", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 20,
            },
        ],
    },
    option_g: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Hinge Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Hamstring", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Conditioning",
                duration: 20,
            },
        ],
    },
}

export default min50Workouts;