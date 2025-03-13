import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Example categories from your existing code
const CORE_EQUIPMENT = [
    { id: 'Barbell', label: 'Barbell' },
    { id: 'Dumbbells', label: 'Dumbbells' },
    { id: 'Kettlebell', label: 'Kettlebell' },
    { id: 'Bench', label: 'Bench' },
    { id: 'Rack', label: 'Rack' },
];
const CARDIO_EQUIPMENT = [
    { id: 'Assault Bike', label: 'Assault Bike' },
    { id: 'Rower', label: 'Rower' },
    { id: 'Treadmill', label: 'Treadmill' },
    { id: 'Ski Erg', label: 'Ski Erg' },
    { id: 'Bike', label: 'Bike' },
];
const ACCESSORIES = [
    { id: 'Bands', label: 'Bands' },
    { id: 'Box', label: 'Box' },
    { id: 'Ball', label: 'Ball' },
    { id: 'Trap Bar', label: 'Trap Bar' },
];
const MACHINES = [
    { id: 'Cables', label: 'Cables' },
    { id: 'Machine Row', label: 'Machine Row' },
    { id: 'Lat Pull Down', label: 'Lat Pull Down' },
    { id: 'Leg Press', label: 'Leg Press' },
    { id: 'Chest Press', label: 'Chest Press' },
    { id: 'Shoulder Press', label: 'Shoulder Press' },
    { id: 'Hamstring Curl', label: 'Hamstring Curl' },
];
const BODYWEIGHT_MACHINES = [
    { id: 'GHD Sit Up', label: 'GHD Sit Up' },
    { id: 'Pull Up Bar', label: 'Pull Up Bar' },
    { id: 'Roman Chair', label: 'Roman Chair' },
    { id: 'Dip Bars', label: 'Dip Bars' },
];

// Helper to map a single equipment ID to a category + label
function findCategoryAndLabel(equipId) {
    // Check each category to see if equipId is in it
    // Return { category: "Core Equipment", label: "Barbell" } or null if not found
    for (let item of CORE_EQUIPMENT) {
        if (item.id === equipId) {
            return { category: "Core Equipment", label: item.label };
        }
    }
    for (let item of CARDIO_EQUIPMENT) {
        if (item.id === equipId) {
            return { category: "Cardio Equipment", label: item.label };
        }
    }
    for (let item of ACCESSORIES) {
        if (item.id === equipId) {
            return { category: "Accessories", label: item.label };
        }
    }
    for (let item of MACHINES) {
        if (item.id === equipId) {
            return { category: "Machines", label: item.label };
        }
    }
    for (let item of BODYWEIGHT_MACHINES) {
        if (item.id === equipId) {
            return { category: "Bodyweight Machines", label: item.label };
        }
    }
    // If not found, fallback
    return { category: "Miscellaneous", label: equipId };
}

export default function ViewFilterModal({
    visible,
    onClose,
    filter,        // { filterName: "Cardio Focus", equipment: ["Barbell","Rower",...] }
    onEdit,        // callback when user taps "Edit Filter"
}) {

    // Group items by category
    const groupedEquipment = useMemo(() => {
        const groups = {
            "Core Equipment": [],
            "Cardio Equipment": [],
            "Accessories": [],
            "Machines": [],
            "Bodyweight Machines": [],
            "Miscellaneous": [],
        };

        if (filter?.equipment) {
            filter.equipment.forEach((equipObj) => {
                const equipName = equipObj.equipment_name;
                const { category, label } = findCategoryAndLabel(equipName);
                groups[category].push(label);
            });
        }
        return groups;
    }, [filter]);

    // How many total pieces of equipment
    const equipmentCount = filter?.equipment?.length || 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.safeArea}>

                <View style={styles.container}>
                    {/* Header Row: Filter Name, X close */}
                    <View style={styles.headerRow}>
                        <Text style={styles.filterName}>{filter?.filterName || "Unnamed Filter"}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={26} color="black" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subTitle}>
                        {equipmentCount} Equipment Selected
                    </Text>

                    <ScrollView style={styles.scrollArea}>
                        {/* CORE EQUIPMENT */}
                        {groupedEquipment["Core Equipment"].length > 0 && (
                            <View style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="barbell-outline" size={18} color="#444" style={{ marginRight: 6 }} />
                                    <Text style={styles.categoryTitle}>Core Equipment</Text>
                                </View>
                                <View style={styles.tagList}>
                                    {groupedEquipment["Core Equipment"].map((label, idx) => (
                                        <View key={idx} style={styles.equipTag}>
                                            <Text style={styles.equipTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* CARDIO EQUIPMENT */}
                        {groupedEquipment["Cardio Equipment"].length > 0 && (
                            <View style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="bicycle-outline" size={18} color="#444" style={{ marginRight: 6 }} />
                                    <Text style={styles.categoryTitle}>Cardio Equipment</Text>
                                </View>
                                <View style={styles.tagList}>
                                    {groupedEquipment["Cardio Equipment"].map((label, idx) => (
                                        <View key={idx} style={styles.equipTag}>
                                            <Text style={styles.equipTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* ACCESSORIES */}
                        {groupedEquipment["Accessories"].length > 0 && (
                            <View style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="briefcase-outline" size={18} color="#444" style={{ marginRight: 6 }} />
                                    <Text style={styles.categoryTitle}>Accessories</Text>
                                </View>
                                <View style={styles.tagList}>
                                    {groupedEquipment["Accessories"].map((label, idx) => (
                                        <View key={idx} style={styles.equipTag}>
                                            <Text style={styles.equipTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* MACHINES */}
                        {groupedEquipment["Machines"].length > 0 && (
                            <View style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="cog-outline" size={18} color="#444" style={{ marginRight: 6 }} />
                                    <Text style={styles.categoryTitle}>Machines</Text>
                                </View>
                                <View style={styles.tagList}>
                                    {groupedEquipment["Machines"].map((label, idx) => (
                                        <View key={idx} style={styles.equipTag}>
                                            <Text style={styles.equipTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* BODYWEIGHT MACHINES */}
                        {groupedEquipment["Bodyweight Machines"].length > 0 && (
                            <View style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="body-outline" size={18} color="#444" style={{ marginRight: 6 }} />
                                    <Text style={styles.categoryTitle}>Bodyweight Machines</Text>
                                </View>
                                <View style={styles.tagList}>
                                    {groupedEquipment["Bodyweight Machines"].map((label, idx) => (
                                        <View key={idx} style={styles.equipTag}>
                                            <Text style={styles.equipTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* MISC */}
                        {groupedEquipment["Miscellaneous"].length > 0 && (
                            <View style={styles.categoryCard}>
                                <View style={styles.categoryHeader}>
                                    <Ionicons name="help-circle-outline" size={18} color="#444" style={{ marginRight: 6 }} />
                                    <Text style={styles.categoryTitle}>Other</Text>
                                </View>
                                <View style={styles.tagList}>
                                    {groupedEquipment["Miscellaneous"].map((label, idx) => (
                                        <View key={idx} style={styles.equipTag}>
                                            <Text style={styles.equipTagText}>{label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Edit Filter Button */}
                    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                        <Text style={styles.editButtonText}>Edit Filter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F1FF', 
    },
    container: {
        flex: 1,
        backgroundColor: '#F3F1FF',
        padding: 20,
        marginTop: 70,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 10,
        marginBottom: 4,
    },
    filterName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
        maxWidth: '80%',
    },
    subTitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 12,
    },
    scrollArea: {
        flex: 1,
        marginBottom: 20,
    },
    categoryCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    equipTag: {
        backgroundColor: '#F9EFEF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    equipTagText: {
        fontSize: 14,
        color: '#333',
    },
    editButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 24,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
    },
});
