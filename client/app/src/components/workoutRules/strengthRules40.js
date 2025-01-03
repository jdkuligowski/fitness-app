const strengthRules40 = {
    full_body_1: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Squat", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull (V)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push (H)", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull (H)", operator: "contains" },
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
                        { key: "movement", value: "Biceps", operator: "contains" },
                    ],
                ],
            },
        ],
    },
    full_body_2: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Hinge", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push (H)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push (V)", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull (V)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
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
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Push (H)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull (V)", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push (V)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull (H) Unilateral", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Chest", operator: "contains" },
                    ]
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Shoulders", operator: "contains" },
                    ],
                    [
                        { key: "movement", value: "Triceps", operator: "contains" },
                    ],
                ],
            },
        ],
    },
    upper_body_2: {
        sections: [
            {
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Push (V)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push (H)", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Pull (V)", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "primary_body_part", value: "Shoulders", operator: "equals" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Pull (H) Unilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "movement", value: "Biceps", operator: "contains" },
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
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Squat", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                        { key: "primary_body_part", value: "Quads", operator: "contains" },

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
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Squat Unilateral", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Hinge Bilateral", operator: "contains" },
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
                section: "Strong 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Hinge", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                        { key: "primary_body_part", value: "Glute", operator: "contains" },
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
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Squat Bilateral", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Hinge Unilateral", operator: "contains" },
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

export default strengthRules40;
