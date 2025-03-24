const min40Workouts = {
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
                duration: 20,
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
                duration: 20,
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
                duration: 30,
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
}

export default min40Workouts;
