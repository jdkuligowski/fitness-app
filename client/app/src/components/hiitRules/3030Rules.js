const tenMinBlocks = [
    {
        movements: [
            { key: "movement", value: "Squat", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Push", operator: "contains" },
            { key: "movement_type", value: "Metcon", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Lunge", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" }
        ]
    },
    {
        movements: [
            { key: "movement", value: "Conditioning", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
        ]
    },
];



const fifteenMinBlocks = [
    {
        movements: [
            { key: "movement", value: "Squat", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Push", operator: "contains" },
            { key: "movement_type", value: "Metcon", operator: "contains" },
            { key: "movement", value: "Lunge", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Lunge", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Conditioning", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
        ]
    },
];



const twentyMinBlocks = [
    {
        movements: [
            { key: "movement", value: "Squat", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Push", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Push", operator: "contains" },
            { key: "movement_type", value: "Metcon", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Lunge", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Lunge", operator: "contains" },
            { key: "movement", value: "Pull", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
        ]
    },
    {
        movements: [
            { key: "movement", value: "Conditioning", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
            { key: "movement", value: "Conditioning", operator: "contains" },
            { key: "primary_body_part", value: "Core", operator: "contains" },
        ]
    },
];


export { tenMinBlocks, fifteenMinBlocks, twentyMinBlocks };
