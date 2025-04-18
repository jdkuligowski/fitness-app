const strengthRules30 = {
    full_body_1: {
        sections: [
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Squat", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Push", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "movement", value: "Push", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Bicep", operator: "contains" },
                    ],
                ],
            },
        ],
    },
    full_body_2: {
        sections: [
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Hinge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Push", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Pull", operator: "contains" },
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
                        { key: "movement", value: "Tricep", operator: "contains" },
                    ],
                ],
            },
        ],
    },
    upper_body_1: {
        sections: [
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Push V", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull V", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Pull H", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Tricep", operator: "contains" },
                    ]
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Shoulder", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "movement", value: "Bicep", operator: "contains" },
                    ],
                ],
            },
        ],
    },
    upper_body_2: {
        sections: [
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Push V", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Bicep", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Chest", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Tricep", operator: "contains" },
                    ],
                ],
            },
        ],
    },
    lower_body_1: {
        sections: [
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Squat", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Hinge", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "primary_body_part", value: "Hamstring", operator: "contains" },
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
        ],
    },
    lower_body_2: {
        sections: [
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Hinge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Squat Unilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "primary_body_part", value: "Glute", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
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
        ],
    },
    push_1: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                        { key: "movement", value: "Push H Bilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Push V", operator: "contains" },
                        { key: "equipment_check", value: "Dumbbell", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "primary_body_part", value: "Shoulder", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 3,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Chest", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Tricep", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                ],
            },
        ],
        push_2: {
            sections: [
                {
                    section: "Strong 1", movements: 1,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                            { key: "movement", value: "Push V Bilateral", operator: "contains" },
                        ],
                    ],
                },
                {
                    section: "Build 1", movements: 2,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Build 1", operator: "contains" },
                            { key: "movement", value: "Push H", operator: "contains" },
                            { key: "equipment_check", value: "Dumbbell", operator: "contains" },
                        ],
                        [
                            { key: "advanced_movements", value: "Build 1", operator: "contains" },
                            { key: "primary_body_part", value: "Chest", operator: "contains" },
                        ],
                    ],
                },
                {
                    section: "Pump 1", movements: 3,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                            { key: "primary_body_part", value: "Shoulder", operator: "contains" },
                        ],
                        [
                            { key: "movement", value: "Tricep", operator: "contains" },
                        ],
                        [
                            { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                            { key: "movement", value: "Push V", operator: "contains" },
                        ],
                    ],
                },
            ],
        },
        pull_1: {
            sections: [
                {
                    section: "Strong 1", movements: 1,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                            { key: "movement", value: "Pull H Bilateral", operator: "contains" },
                        ],
                    ],
                },
                {
                    section: "Build 1", movements: 2,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Build 1", operator: "contains" },
                            { key: "movement", value: "Pull V", operator: "contains" },

                        ],
                        [
                            { key: "advanced_movements", value: "Build 1", operator: "contains" },
                            { key: "movement", value: "Pull H Unilateral", operator: "contains" },
                        ],
                    ],
                },
                {
                    section: "Pump 1", movements: 2,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                            { key: "primary_body_part", value: "Back", operator: "contains" },
                        ],
                        [
                            { key: "movement", value: "Bicep", operator: "contains" },
                        ],
                    ],
                },
            ],
        },
        pull_2: {
            sections: [
                {
                    section: "Strong 1", movements: 1,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Strong 1", operator: "contains" },
                            { key: "movement", value: "Pull V Bilateral", operator: "contains" },
                        ],
                    ],
                },
                {
                    section: "Build 1", movements: 2,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Build 1", operator: "contains" },
                            { key: "movement", value: "Pull H", operator: "contains" },

                        ],
                        [
                            { key: "movement", value: "Bicep", operator: "contains" },

                        ],
                    ],
                },
                {
                    section: "Pump 1", movements: 2,
                    filters: [
                        [
                            { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                            { key: "primary_body_part", value: "Back", operator: "contains" },
                        ],
                        [
                            { key: "movement", value: "Bicep", operator: "contains" },
                        ],
                    ],
                },
            ],
        }
    }
}

export default strengthRules30;
