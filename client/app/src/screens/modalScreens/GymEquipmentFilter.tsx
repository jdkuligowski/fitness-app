import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ENV from '../../../../env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colours } from '../../components/styles';

const CORE_EQUIPMENT = [
    { id: 'Barbell', label: 'Barbell' },
    { id: 'Dumbbell', label: 'Dumbbell' },
    { id: 'Kettlebell', label: 'Kettlebell' },
    { id: 'Bench', label: 'Bench' },
    { id: 'Rack', label: 'Rack' },
];

const CARDIO_EQUIPMENT = [
    { id: 'Assault Bike', label: 'Assault Bike' },
    { id: 'Rower', label: 'Rower' },
    { id: 'Treadmill', label: 'Treadmill' },
    { id: 'Ski', label: 'Ski' },
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
    isEdit = false,         // if true, we load existing data
    existingFilter = null, // { filterId, filterName, equipment: [...] }
    onSave,                // callback after a new filter is created
    onUpdate,              // callback after an existing filter is updated
    initialSelections = {}  // pass in already selected equipment if needed
}) {
    const navigation = useNavigation();

    const [selectedEquipment, setSelectedEquipment] = useState(initialSelections);
    const [equipmentSetName, setEquipmentSetName] = useState('');

    useEffect(() => {
        if (visible && isEdit && existingFilter) {
            // Fill the name
            setEquipmentSetName(existingFilter.filterName || '');
            // Build the `selectedEquipment` map from the array
            const temp = {};
            existingFilter.equipment?.forEach((equipObj) => {
                // e.g. {id: 3, equipment_name: "Barbell"}
                // We'll interpret the "label" as equipObj.equipment_name if you prefer
                // or if your data is just the string e.g. "Barbell," adapt accordingly
                const name = equipObj.equipment_name || equipObj.label || equipObj;
                temp[name] = true;
            });
            setSelectedEquipment(temp);
        }
        // If create mode, it might default to empty
        else if (visible && !isEdit) {
            setEquipmentSetName('');
            setSelectedEquipment({});
        }
    }, [visible, isEdit, existingFilter]);

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


    // 6) Handling Save or Update
    const handleSaveOrUpdate = async () => {
        // Convert `selectedEquipment` map -> array
        const selectedIds = Object.keys(selectedEquipment).filter((id) => selectedEquipment[id]);

        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                alert("No user ID found");
                return;
            }

            if (!isEdit) {
                // CREATE new filter
                const response = await fetch(
                    `${ENV.API_URL}/api/equipment_filters/create?user_id=${userId}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: equipmentSetName,
                            equipmentIds: selectedIds,
                        }),
                    }
                );
                if (response.ok) {
                    const newFilter = await response.json();
                    console.log("Filter Created:", newFilter);
                    onSave?.(newFilter);
                    onClose();
                } else {
                    const errData = await response.json();
                    alert(errData.error || "Failed to create filter");
                }
            } else {
                // EDIT existing filter
                // Suppose we have an endpoint like /api/equipment_filters/<filterId>?user_id=...
                // for a PUT or PATCH
                const filterId = existingFilter.filterId;
                const response = await fetch(
                    `${ENV.API_URL}/api/equipment_filters/${filterId}/update?user_id=${userId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: equipmentSetName,
                            equipmentIds: selectedIds,
                        }),
                    }
                );
                if (response.ok) {
                    const updatedFilter = await response.json();
                    console.log("Filter Updated:", updatedFilter);
                    onUpdate?.(updatedFilter);
                    onClose();
                } else {
                    const errData = await response.json();
                    alert(errData.error || "Failed to update filter");
                }
            }
        } catch (error) {
            console.error("Error saving/updating filter:", error);
            alert("Error saving/updating filter, please try again");
        }
    };


    const renderEquipmentSection = (title, items, iconName) => {
        return (
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                        {/* Example icon - you can import from Ionicons or use a custom image */}
                        <Ionicons name={iconName} size={20} color="#4D4D4D" style={{ marginRight: 8 }} />
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                    <TouchableOpacity style={styles.sectionToggle} onPress={() => toggleAllInCategory(items)}>
                        <Text style={styles.sectionToggleText}>
                            {areAllSelected(items) ? 'Unselect all' : 'Select all'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.equipmentList}>
                    {items.map((item, index) => {
                        const isSelected = !!selectedEquipment[item.id];
                        return (
                            <TouchableOpacity
                                key={item.id || index}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.selectedOption,
                                ]}
                                onPress={() => toggleEquipment(item.id)}
                            >
                                {/* Circle to show selected vs. not selected */}
                                <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]} />
                                {/* Label */}
                                <Text style={styles.optionLabel}>{item.label}</Text>
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
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
            <View style={styles.safeArea}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEdit ? "Edit Filter" : "Create a Filter"}
                    </Text>
                </View>

                {/* Subheader with "Select Equipment" and "Select All" */}
                <View style={styles.subHeader}>
                    <Text style={styles.subHeaderText}>Select Equipment</Text>
                    <TouchableOpacity style={styles.selectAllButton} onPress={selectAllEquipment}>
                        <Text style={styles.selectAllText}>Select All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Example calls. Provide your actual sections & icons */}
                    {renderEquipmentSection('Core Equipment', CORE_EQUIPMENT, 'barbell-outline')}
                    {renderEquipmentSection('Cardio Equipment', CARDIO_EQUIPMENT, 'bicycle-outline')}
                    {renderEquipmentSection('Accessories', ACCESSORIES, 'briefcase-outline')}
                    {renderEquipmentSection('Machines', MACHINES, 'cog-outline')}
                    {renderEquipmentSection('Bodyweight Machines', BODYWEIGHT_MACHINES, 'body-outline')}

                    {/* Filter Name Input */}
                    <View style={styles.nameContainer}>
                        <Text style={styles.nameLabel}>Filter name</Text>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Home gym, Work gym..."
                            value={equipmentSetName}
                            onChangeText={setEquipmentSetName}
                        />
                    </View>

                    {/* Save Button */}
                    <View style={styles.saveWrapper}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveOrUpdate}>
                            <Text style={styles.saveButtonText}>
                                {isEdit ? "Update" : "Create"}

                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
        </Modal >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colours.primaryBackground,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colours.primaryBackground,
        paddingTop: 70,
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },

    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginHorizontal: 16,
    },
    subHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectAllButton: {
        borderWidth: 1,
        borderColor: 'black',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    selectAllText: {
        fontSize: 12,
        color: 'black',
    },

    scrollContainer: {
        paddingBottom: 60,
    },

    // Each equipment section
    sectionCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        // shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        // elevation for Android
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sectionToggle: {
        backgroundColor: Colours.buttonColour,
        borderWidth: 1,
        borderColor: '#ADADAD',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 6,
        // color: 'black',
    },
    sectionToggleText: {
        fontSize: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        // borderWidth: 1,
        // borderColor: '#6E44FF',
        borderRadius: 6,
        color: 'white',
        fontWeight: 600,
    },

    equipmentList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // justifyContent: 'space-between',
    },
    optionButton: {
        // Matches your "optionButton" style
        // width: '48%',
        borderWidth: 1,
        borderColor: '#B0B0B0',
        borderRadius: 10,
        backgroundColor: 'white',
        marginBottom: 10,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    selectedOption: {
        // Similar to "selectedOption" 
        backgroundColor: 'white',
        borderColor: 'black',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    optionCircle: {
        // Replaces Ionicons checkbox with a circle
        width: 20,
        height: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#B0B0B0',
        marginRight: 5,
    },
    optionCircleSelected: {
        // When selected, highlight
        borderColor: '#008080', // e.g. teal or your brand color
        backgroundColor: Colours.buttonColour,
    },
    optionLabel: {
        fontSize: 12,
        color: '#333',
    },

    nameContainer: {
        marginTop: 20,
        marginHorizontal: 16,
    },
    nameLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#333',
    },
    nameInput: {
        borderWidth: 1,
        borderColor: '#CCC',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 15,
        fontSize: 14,
    },
    saveWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveButton: {
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: Colours.buttonColour,
        borderRadius: 20,
        paddingVertical: 14,
        alignItems: 'center',
        width: '80%',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
