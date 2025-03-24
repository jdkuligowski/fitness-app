const min30Workouts = {
    squat_option: {
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
                duration: 20,
            },
        ],
    },
    hinge_option: {
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
                duration: 20,
            },
        ],
    },
    lunge_option: {
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
                duration: 20,
            },
        ],
    },
}

export default min30Workouts;
