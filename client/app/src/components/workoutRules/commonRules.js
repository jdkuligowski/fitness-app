const commonRules = {
    warmUpA: { section: "Warm up A", movements: 1, filters: [[{ key: "movement", value: "Conditioning", operator: "contains" }]] },
    warmUpB: { section: "Warm up B", movements: 3, filters: [[{ key: "movement_type", value: "Warm Up", operator: "contains" }]] },
};

export default commonRules