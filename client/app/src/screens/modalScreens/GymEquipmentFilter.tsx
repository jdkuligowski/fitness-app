import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ENV from '../../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';

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


export default function EquipmentFilterModal({
    visible,
    onClose,
    onSave,              // callback to handle saving
    initialSelections = {}  // pass in already selected equipment if needed
}) {
    const [selectedEquipment, setSelectedEquipment] = useState(initialSelections);
    const [equipmentSetName, setEquipmentSetName] = useState('');

    // Toggle an item
    const toggleEquipment = (id) => {
        setSelectedEquipment((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Check if all items in a list are selected
    const areAllSelected = (items) => items.every((item) => selectedEquipment[item.id]);

    // Toggle all in a section
    const toggleAllInCategory = (items) => {
        const allSelected = areAllSelected(items);
        const updates = {};
        items.forEach((item) => {
            updates[item.id] = !allSelected;
        });
        setSelectedEquipment((prev) => ({
            ...prev,
            ...updates
        }));
    };

    // "Select all" across all sections
    const selectAllEquipment = () => {
        const allGroups = [
            ...CORE_EQUIPMENT,
            ...CARDIO_EQUIPMENT,
            ...ACCESSORIES,
            ...MACHINES,
            ...BODYWEIGHT_MACHINES
        ];
        const allAlreadySelected = allGroups.every((item) => selectedEquipment[item.id]);
        const updates = {};
        allGroups.forEach((item) => {
            updates[item.id] = !allAlreadySelected;
        });
        setSelectedEquipment(updates);
    };

    // Save handler
    const handleSave = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const selectedIds = Object.keys(selectedEquipment).filter((id) => selectedEquipment[id]);

            const response = await fetch(
                `${ENV.API_URL}/api/equipment_filters/create?user_id=${userId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: equipmentSetName,
                        equipmentIds: selectedIds
                    })
                }
            );

            if (response.ok) {
                const newFilter = await response.json();
                console.log("Filter Created:", newFilter);

                // Persist minimal info so you know which filter is active
                // e.g. { filterName: "Home Gym", equipment: ["Barbell","Rack"] }
                const filterToStore = {
                    filterId: newFilter.id, // <--- IMPORTANT
                    filterName: newFilter.filter_name || equipmentSetName,
                    equipment: selectedIds,
                };
                await AsyncStorage.setItem("activeEquipmentFilter", JSON.stringify(filterToStore));
                await AsyncStorage.setItem("activeFilterId", JSON.stringify(newFilter.id));

                // Then do your normal onSave & onClose
                onSave(newFilter);
                onClose();
            } else {
                // handle error
                const errData = await response.json();
                alert(errData.error || "Failed to create filter");
            }
        } catch (error) {
            console.error("Error saving filter:", error);
            alert("Error saving filter, please try again");
        }
    };


    const renderEquipmentSection = (title, items) => {
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <TouchableOpacity onPress={() => toggleAllInCategory(items)}>
                        <Text style={styles.sectionToggle}>
                            {areAllSelected(items) ? 'Unselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.equipmentList}>
                    {items.map((item) => {
                        const isSelected = !!selectedEquipment[item.id];
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.equipmentItem, isSelected && styles.equipmentItemSelected]}
                                onPress={() => toggleEquipment(item.id)}
                            >
                                <Ionicons
                                    name={isSelected ? 'checkbox' : 'checkbox-outline'}
                                    size={20}
                                    color={isSelected ? 'green' : 'grey'}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={styles.equipmentLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={26} color="black" />
                    </TouchableOpacity>
                    <View style={styles.modalSubHeader}>

                        <Text style={styles.modalTitle}>Select Equipment</Text>
                        <TouchableOpacity onPress={selectAllEquipment}>
                            <Text style={styles.modalTitle}>
                                Select All
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.modalContent}>
                    {renderEquipmentSection('Core Equipment', CORE_EQUIPMENT)}
                    {renderEquipmentSection('Cardio Equipment', CARDIO_EQUIPMENT)}
                    {renderEquipmentSection('Accessories', ACCESSORIES)}
                    {renderEquipmentSection('Machines', MACHINES)}
                    {renderEquipmentSection('Bodyweight Machines', BODYWEIGHT_MACHINES)}

                    {/* Name Input */}
                    <View style={styles.saveContainer}>
                        <Text style={styles.saveLabel}>Save equipment set as:</Text>
                        <TextInput
                            style={styles.saveInput}
                            placeholder="Main gym, Home gym..."
                            value={equipmentSetName}
                            onChangeText={setEquipmentSetName}
                        />

                    </View>
                </ScrollView>
                <View style={styles.saveSection}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flexGrow: 1,
        backgroundColor: '#fff'
    },
    modalHeader: {
        flexDirection: 'column',
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'flex-end',
        // justifyContent: 'space-between',
        // borderBottomWidth: 1,
        // borderColor: '#ddd', 
        marginTop: 50,
    },
    modalSubHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignContent: 'center',
        width: '100%',
        marginTop: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600'
    },
    modalContent: {
        padding: 16,
        height: 400,
    },
    sectionContainer: {
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    sectionToggle: {
        fontSize: 14,
        color: 'blue'
    },
    equipmentList: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    equipmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
        marginBottom: 8
    },
    equipmentItemSelected: {
        backgroundColor: '#eee'
    },
    equipmentLabel: {
        fontSize: 14
    },
    saveContainer: {
        marginTop: 0
    },
    saveLabel: {
        fontSize: 14,
        marginBottom: 6
    },
    saveInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 12,
        borderRadius: 6
    },
    saveButton: {
        backgroundColor: 'black',
        padding: 15,
        borderRadius: 6,
        alignItems: 'center'
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    saveSection: {
        paddingTop: 20,
        paddingLeft: 10,
        paddingRight: 10,
        marginBottom: 50,
    },
});
