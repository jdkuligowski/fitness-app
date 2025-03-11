const baseAmrapBlocks = [
    {
        repScheme: "15-12-10",
        movements: [
            { key: "movement", value: "Squat", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Push", operator: "contains" }
        ]
    },
    {
        repScheme: "8-6-4",
        movements: [
            { key: "movement", value: "Lunge", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement_type", value: "Metcon", operator: "contains" }
        ]
    },
    {
        repScheme: "10 + 45s",
        movements: [
            { key: "movement_type", value: "Metcon", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" }
        ]
    },
    {
        repScheme: "12-12-12",
        movements: [
            { key: "movement", value: "Squat", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement_type", value: "Metcon", operator: "contains" }
        ]
    },
    {
        repScheme: "10-10-30s",
        movements: [
            { key: "movement", value: "Lunge", operator: "contains" },
            { key: "movement", value: "Pull H", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" }
        ]
    },
    {
        repScheme: "10-10-30s",
        movements: [
            { key: "movement", value: "Hinge", operator: "contains" },
            { key: "movement", value: "Push", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" }
        ]
    },
];

const amrapWorkouts = [
    {
        duration: 10,
        type: "2 x 4' AMRAPs",
        amraps: [baseAmrapBlocks[0], baseAmrapBlocks[1]]
    },
    {
        duration: 10,
        type: "2 x 4' AMRAPs",
        amraps: [baseAmrapBlocks[2], baseAmrapBlocks[3]]
    },
    {
        duration: 10,
        type: "2 x 4' AMRAPs",
        amraps: [baseAmrapBlocks[4], baseAmrapBlocks[5]]
    },
    {
        duration: 15,
        type: "2 x 6' AMRAPs",
        amraps: [baseAmrapBlocks[0], baseAmrapBlocks[1]]
    },
    {
        duration: 15,
        type: "2 x 6' AMRAPs",
        amraps: [baseAmrapBlocks[2], baseAmrapBlocks[3]]
    },
    {
        duration: 15,
        type: "2 x 6' AMRAPs",
        amraps: [baseAmrapBlocks[4], baseAmrapBlocks[5]]
    },
    {
        duration: 20,
        type: "3 x 5' AMRAPs",
        amraps: [baseAmrapBlocks[0], baseAmrapBlocks[1],
        {
            repScheme: "8-6-30s",
            movements: [
                { key: "movement", value: "Hinge", operator: "contains" },
                { key: "movement_type", value: "Metcon", operator: "contains" },
                { key: "movement", value: "Conditioning", operator: "contains" }
            ]
        }
        ]
    },
    {
        duration: 20,
        type: "3 x 5' AMRAPs",
        amraps: [baseAmrapBlocks[2], baseAmrapBlocks[3],
        {
            repScheme: "10-10-60s",
            movements: [
                { key: "movement", value: "Lunge", operator: "contains" },
                { key: "movement", value: "Push", operator: "contains" },
                { key: "movement", value: "Conditioning", operator: "contains" }
            ]
        }
        ]
    },
    {
        duration: 20,
        type: "3 x 5' AMRAPs",
        amraps: [baseAmrapBlocks[4], baseAmrapBlocks[5],
        {
            repScheme: "10-10-30s",
            movements: [
                { key: "movement", value: "Squat", operator: "contains" },
                { key: "primary_body_part", value: "Core", operator: "contains" },
                { key: "movement", value: "Conditioning", operator: "contains" }
            ]
        }
        ]
    },
    {
        duration: 20,
        type: "3 x 5' AMRAPs",
        amraps: [baseAmrapBlocks[4], baseAmrapBlocks[5],
        {
            repScheme: "10-10-30s",
            movements: [
                { key: "movement", value: "Squat", operator: "contains" },
                { key: "primary_body_part", value: "Core", operator: "contains" },
                { key: "movement", value: "Conditioning", operator: "contains" }
            ]
        }
        ]
    },
    {
        duration: 30,
        type: "2 x 12' AMRAPs",
        amraps: [
            {
                repScheme: "2'-15-10",
                movements: [
                    { key: "movement", value: "Conditioning", operator: "contains" },
                    { key: "movement", value: "Push V", operator: "contains" },
                    { key: "movement", value: "Jumps", operator: "contains" }
                ]
            },
            {
                repScheme: "2'-15-10",
                movements: [
                    { key: "movement", value: "Conditioning", operator: "contains" },
                    { key: "movement", value: "Pull H", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                ]
            },
        ]
    },
    {
        duration: 30,
        type: "2 x 12' AMRAPs",
        amraps: [
            {
                repScheme: "20-20-20",
                movements: [
                    { key: "movement", value: "Squat", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "movement", value: "Push H", operator: "contains" }
                ]
            },
            {
                repScheme: "20-20-20",
                movements: [
                    { key: "movement", value: "Lunge", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "movement", value: "Pull H", operator: "contains" }
                ]
            },
        ]
    },
    {
        duration: 30,
        type: "2 x 12' AMRAPs",
        amraps: [
            {
                repScheme: "Ladder climb: add 2 reps each round",
                movements: [
                    { key: "movement", value: "Jumps", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "movement", value: "Push H", operator: "contains" }
                ]
            },
            {
                repScheme: "Ladder climb: add 2 reps each round",
                movements: [
                    { key: "movement", value: "Squat", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "advanced_movements", value: "Metcon", operator: "contains" }
                ]
            },
        ]
    },
    {
        duration: 40,
        type: "3 x 10' AMRAPs",
        amraps: [
            {
                repScheme: "10 + 10 + 10 + 60s",
                movements: [
                    { key: "movement", value: "Squat", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "movement", value: "Pull H", operator: "contains" },
                    { key: "movement", value: "Conditioning", operator: "contains" }
                ]
            },
            {
                repScheme: "10 + 10 + 10 + 60s",
                movements: [
                    { key: "advanced_movements", value: "Metcon", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "movement", value: "Push H", operator: "contains" },
                    { key: "movement", value: "Conditioning", operator: "contains" }
                ]
            },
            {
                repScheme: "10 + 10 + 10 + 60s",
                movements: [
                    { key: "movement", value: "Jumps", operator: "contains" },
                    { key: "primary_body_part", value: "Core", operator: "contains" },
                    { key: "advanced_movements", value: "Metcon", operator: "contains" },
                    { key: "movement", value: "Conditioning", operator: "contains" }
                ]
            },
        ]
    },
];


export default amrapWorkouts

