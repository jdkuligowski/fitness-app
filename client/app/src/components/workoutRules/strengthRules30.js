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
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
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
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
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
                        { key: "movement", value: "Biceps", operator: "contains" },
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
                        { key: "movement", value: "Triceps", operator: "contains" },
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
                        { key: "movement", value: "Push (V)", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull (V)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Pull (H)", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 2", operator: "contains" },
                        { key: "movement", value: "Triceps", operator: "contains" },
                    ]
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "primary_body_part", value: "Shoulders", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Pump 1", operator: "contains" },
                        { key: "movement", value: "Biceps", operator: "contains" },
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
                        { key: "movement", value: "Push (H)", operator: "contains" },
                    ],
                    [
                        { key: "advanced_movements", value: "Build 1", operator: "contains" },
                        { key: "movement", value: "Pull (H)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Push (V)", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Biceps", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Chest", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Triceps", operator: "contains" },
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
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Squat", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Hinge Unilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Hamstring", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
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
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Hinge Bilateral", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Squat Unilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "primary_body_part", value: "Glute", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "equals" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Hamstring", operator: "contains" },
                    ],
                ],
            },
        ],
    }
}

export default strengthRules30;
