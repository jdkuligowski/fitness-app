const strengthRules50 = {
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
                section: "Strong 2", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Pull V", operator: "contains" },
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
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Hinge Unilateral", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Accessory, Metcon"], operator: "contains" },
                        { key: "primary_body_part", value: "Core", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "body_area", value: "Lower", operator: "contains" },
                        { key: "movement_type", value: ["Metcon, Accessory"], operator: "contains" },
                    ],
                    [
                        { key: "body_area", value: "Upper", operator: "contains" },
                        { key: "movement_type", value: ["Metcon, Accessory"], operator: "contains" },
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
                section: "Strong 2", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                        { key: "primary_body_part", value: "Quad", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: ["Primary, Secondary"], operator: "contains" },
                        { key: "movement", value: "Pull V", operator: "contains" },
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
                        { key: "movement_type", value: ["Accessory, Metcon"], operator: "contains" },
                        { key: "primary_body_part", value: "Core", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 2,
                filters: [
                    [
                        { key: "body_area", value: "Lower", operator: "contains" },
                        { key: "movement_type", value: ["Metcon, Accessory"], operator: "contains" },
                    ],
                    [
                        { key: "body_area", value: "Upper", operator: "contains" },
                        { key: "movement_type", value: ["Metcon, Accessory"], operator: "contains" },
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
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Strong 2", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Pull V", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push V", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull V", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull H Unilateral", operator: "contains" },
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
                        { key: "movement", value: "Biceps", operator: "contains" },
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
                        { key: "movement", value: "Push V", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Strong 2", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Pull H", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Push H", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull V", operator: "contains" },
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
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Pull H Unilateral", operator: "contains" },
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
                section: "Strong 2", movements: 1,
                filters: [
                    [
                        // { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                        { key: "primary_body_part", value: "Glute", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Hinge", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Squat Unilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "primary_body_part", value: "Quad", operator: "contains" },
                    ],
                    [
                        { key: "primary_body_part", value: "Core", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 1,
                filters: [
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
                section: "Strong 2", movements: 1,
                filters: [
                    [
                        // { key: "movement_type", value: "Primary", operator: "contains" },
                        { key: "movement", value: "Lunge", operator: "contains" },
                        { key: "primary_body_part", value: "Quad", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 1", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Squat", operator: "contains" },
                    ],
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "movement", value: "Hinge Unilateral", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Build 2", movements: 2,
                filters: [
                    [
                        { key: "movement_type", value: "Secondary", operator: "contains" },
                        { key: "primary_body_part", value: "Hamstring", operator: "contains" },
                    ],
                    [
                        { key: "primary_body_part", value: "Core", operator: "contains" },
                    ],
                ],
            },
            {
                section: "Pump 1", movements: 1,
                filters: [
                    [
                        { key: "movement_type", value: ["Metcon, Secondary"], operator: "contains" },
                        { key: "primary_body_part", value: "Quad", operator: "contains" },
                    ],
                ],
            },
        ],
    },

}

export default strengthRules50;
