import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useLoader } from '@/app/src/context/LoaderContext';
import ENV from '../../../../env';
import { Colours } from '../../components/styles';
import LoadChart from './Charts/ExerciseLoadChart';
import BouncingLoader from '../../components/BouncingLoader'
const screenHeight = Dimensions.get('window').height;
const TABLE_MAX_HEIGHT = screenHeight * 0.6;


export default function MovementStatsScreen({
    isModal = false,
    onClose = () => { },
    lockedMovementId = null,
    lockedMovementName = null,

}) {
    const { setIsBouncerLoading, isBouncerLoading } = useLoader(); // Access loader functions
    const navigation = useNavigation();
    const [summaries, setSummaries] = useState([]);
    const [strengthSets, setStrengthSets] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedMovementValue, setSelectedMovementValue] = useState(
        lockedMovementId ? lockedMovementId.toString() : null
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('summary');

    // 1. Fetch data from the server
    async function fetchMovementStats(setSummaries, setStrengthSets) {
        setIsBouncerLoading(true)
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                console.log("No userId in storage!");
                setIsBouncerLoading(false);
                return;
            }
            const url = `${ENV.API_URL}/api/movement_summary_stats/?user_id=${userId}`;
            const response = await axios.get(url);
            console.log('Fetched movement stats:', response.data);

            setSummaries(response.data.summaries || []);
            setStrengthSets(response.data.strength_sets || []);
            setIsBouncerLoading(false);

        } catch (error) {
            console.error("Error fetching movement stats:", error);
            setIsBouncerLoading(false);
        }
    }

    // 2. Filter your "summaries" array by searchTerm
    function getFilteredMovements(summaries, searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        return summaries.filter((item) => {
            // item.movement.exercise is the displayed name
            const exerciseName = item.movement?.exercise?.toLowerCase() || '';
            return exerciseName.includes(lowerSearch);
        });
    }

    // 3. Build the dropdown items from your data
    function buildDropdownItems(filtered) {
        // Each item: { label: string, value: string }
        return filtered
            .filter((s) => s.movement?.id) // keep only if we have a valid ID
            .map((s) => ({
                label: s.movement.exercise || 'Unknown',
                value: s.movement.id.toString()
            }));
    }

    // 4. Find the user’s chosen summary
    function getSelectedSummary(summaries, movementId) {
        if (!movementId) return null;
        return summaries.find(
            (s) => s.movement && s.movement.id === movementId
        );
    }

    // 5. Find all “records” for the chosen movement, sorted by date & set #
    function getSelectedRecords(strengthSets, movementId) {
        if (!movementId) return [];

        // 1) Filter by movement
        let filtered = strengthSets.filter(
            (s) => s.movement && s.movement.id === movementId
        );

        // 2) Sort by date DESC, then set_number ASC
        filtered.sort((a, b) => {
            const dateA = new Date(a.performed_date);
            const dateB = new Date(b.performed_date);

            // Compare dates first (descending)
            if (dateA > dateB) return -1; // most recent first
            if (dateA < dateB) return 1;

            // If on the same date, compare set_number ascending
            return (a.set_number || 0) - (b.set_number || 0);
        });

        return filtered;
    }



    // -----------------------
    // 1) Fetch on mount
    // -----------------------
    useEffect(() => {
        fetchMovementStats(setSummaries, setStrengthSets);
    }, []);

    // 2) Filter movements by `searchTerm`
    const filteredMovements = getFilteredMovements(summaries, searchTerm);

    // 3) Build dropdown items from the filtered data
    const dropdownItems = buildDropdownItems(filteredMovements);

    // 4) Convert selected value (string) to numeric ID
    const selectedMovementId = selectedMovementValue
        ? parseInt(selectedMovementValue, 10)
        : null;

    // 5) Derive the chosen summary & records
    const selectedSummary = getSelectedSummary(summaries, selectedMovementId);
    const selectedRecords = getSelectedRecords(strengthSets, selectedMovementId);

    // 6) Called by onChangeValue in DropDownPicker
    const handleMovementSelect = (val) => {
        setSelectedMovementValue(val);

        if (val) {
            const numericId = parseInt(val, 10);
            // Show the user what we have
            const recs = getSelectedRecords(strengthSets, numericId);
            console.log('Selected movement ID =>', numericId);
            console.log('Filtered records =>', recs);  // Log to console
        }
    };

    function formatDateWithRelative(dateString) {
        if (!dateString) return '';

        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) {
            // Invalid date
            return dateString;
        }

        // Make 'local' date objects set to midnight for easy same-day comparison
        const targetMidnight = new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate()
        );
        const now = new Date();
        const nowMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        // Calculate difference in days
        const diffMs = targetMidnight - nowMidnight;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // same date as 'today'
            return 'Today';
        } else if (diffDays === -1) {
            // exactly one day behind
            return 'Yesterday';
        } else {
            // otherwise, return the original string (or you can format to 'YYYY-MM-DD')
            return dateString;
        }
    }

    const lockedSummary = lockedMovementId
        ? summaries.find((s) => s.movement?.id === lockedMovementId)
        : null;


    if (isBouncerLoading) {
        return (
            // <SafeAreaView style={styles.centered}>
            <BouncingLoader />
            // </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                {/* // contentContainerStyle={styles.statsPageContainer}> */}
                {/* Header Row: either "Close" if modal, or "Back" if normal page */}
                {isModal ? (
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.screenHeader}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color="black" />
                            </TouchableOpacity>
                            <Text style={styles.headingText}>Movement stats</Text>
                        </View>
                    </>
                )}


                {/* The DropDownPicker */}
                {!lockedMovementId ?
                    <DropDownPicker
                        placeholder="Select a movement"
                        open={open}
                        setOpen={setOpen}
                        value={selectedMovementValue}
                        setValue={setSelectedMovementValue} // if we let the library manage it
                        items={dropdownItems}
                        setItems={() => { }} // no-op (we're building the array ourselves)
                        searchable
                        searchPlaceholder="Type to filter..."
                        style={styles.dropdownPicker}
                        // containerStyle={{ marginBottom: 12 }}
                        zIndex={9999}
                        onChangeValue={handleMovementSelect}
                        dropDownContainerStyle={{
                            backgroundColor: '#fff',      // the drop-down menu background
                            borderColor: 'black',
                            margin: 20,
                            width: '90%',
                            minHeight: 300,
                            borderLeftWidth: 1,
                            borderTopWidth: 1,
                            borderRightWidth: 4,
                            borderBottomWidth: 4,
                        }}
                        listItemContainerStyle={{
                            height: 40,                   // each item’s container height
                        }}
                        listItemLabelStyle={{
                            color: '#333',                // color of each item’s text
                            fontSize: 16,
                        }}
                        selectedItemLabelStyle={{
                            fontWeight: 'bold',           // make selected item label bold
                        }}
                        selectedItemContainerStyle={{
                            backgroundColor: Colours.primaryBackground,   // highlight the selected item row
                        }}
                    />
                    :
                    <Text style={styles.movementTitle}>
                        {`${lockedMovementName} history` ?? 'Movement'}
                    </Text>
                }

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'summary' && styles.activeTab
                        ]}
                        onPress={() => setActiveTab('summary')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'summary' && styles.activeTabText
                            ]}
                        >
                            Summary
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'records' && styles.activeTab
                        ]}
                        onPress={() => setActiveTab('records')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'records' && styles.activeTabText
                            ]}
                        >
                            Records
                        </Text>
                    </TouchableOpacity>
                </View>


                {/* If no movement selected, show message */}
                {/* Show summary tab */}
                {
                    selectedMovementId && activeTab === 'summary' && (
                        <View style={styles.summaryContainer}>
                            {selectedSummary ? (
                                <>
                                    {/* Row of 2 cards */}
                                    <View style={styles.summaryCardContainer}>
                                        <View style={styles.summaryCard}>
                                            <Text style={styles.cardTitle}>Est. 1RM</Text>
                                            <Text style={styles.cardValue}>
                                                {selectedSummary.estimated_1rm
                                                    ? Math.round(selectedSummary.estimated_1rm)
                                                    : 0}
                                            </Text>
                                        </View>

                                        <View style={styles.summaryCard}>
                                            <Text style={styles.cardTitle}>Best Reps × Weight</Text>
                                            <Text style={styles.cardValue}>
                                                {`${selectedSummary.best_reps} x ${selectedSummary.best_weight}`}
                                                {/* or you can do something like: (selectedSummary.best_weight || 0) × (selectedSummary.best_reps || 0) */}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Bar chart placeholder */}
                                    <View style={styles.chartContainer}>
                                        <Text style={styles.chartTitle}>Training load over time</Text>
                                        {/* Use the LoadChart component here */}
                                        <LoadChart records={selectedRecords} />
                                    </View>
                                </>
                            ) : (
                                <View style={styles.noData}>
                                    <Text style={styles.noDataText}>Log a workout to see a summary for this exercise</Text>
                                </View>
                            )}
                        </View>
                    )
                }



                {/* Show records tab */}
                {selectedMovementId && activeTab === 'records' && (

                    selectedRecords.length === 0 ? (
                        <View style={styles.noData}>
                            <Text style={styles.noDataText}>Log a workout to see records for this exercise</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.recordsContainer}>

                                <View style={styles.tableHeader}>
                                    <Text style={[styles.headerCell, { flex: 2 }]}>Date</Text>
                                    <Text style={[styles.headerCell, { flex: 0.8 }]}>Set #</Text>
                                    <Text style={[styles.headerCell, { flex: 0.8 }]}>Reps</Text>
                                    <Text style={[styles.headerCell, { flex: 1 }]}>Weight</Text>
                                    <Text style={[styles.headerCell, { flex: 0.8 }]}>RPE</Text>
                                </View>
                                <FlatList
                                    data={selectedRecords}
                                    keyExtractor={(_, index) => index.toString()}
                                    style={styles.tableBody} // optional, if you need more styling
                                    renderItem={({ item }) => (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.rowCell, { flex: 2 }]}>
                                                {formatDateWithRelative(item.performed_date)}
                                            </Text>
                                            <Text style={[styles.rowCell, { flex: 0.8 }]}>
                                                {item.set_number}
                                            </Text>
                                            <Text style={[styles.rowCell, { flex: 0.8 }]}>
                                                {item.reps}
                                            </Text>
                                            <Text style={[styles.rowCell, { flex: 1 }]}>
                                                {item.weight}
                                            </Text>
                                            <Text style={[styles.rowCell, { flex: 0.8 }]}>
                                                {item.rpe}
                                            </Text>
                                        </View>
                                    )} />
                            </View>
                        </>
                    )
                )
                }
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colours.primaryBackground,
    },
    statsPageContainer: {
        flexGrow: 1,
        backgroundColor: Colours.primaryBackground,
        paddingBottom: 10,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    screenHeader: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    headingText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'black',
        marginLeft: 10,
    },
    searchContainer: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,

    },
    searchInput: {
        height: 60,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        borderRadius: 20,

    },
    dropdownPicker: {
        margin: 20,
        width: '90%',
        borderColor: 'black',
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    movementTitle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginHorizontal: 20,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 600,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        // marginTop: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: 'black',
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },

    tab: {
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderRadius: 10,
        backgroundColor: 'white',
        width: '45%',
    },

    activeTab: {
        backgroundColor: Colours.buttonColour,
    },
    tabText: {
        fontSize: 14,
        color: 'black',
        textAlign: 'center',
    },
    activeTabText: {
        fontWeight: 'bold',
        color: Colours.secondaryColour,
    },


    chartPlaceholder: {
        height: 150,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16
    },
    noData: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: 20,
    },
    noDataText: {
        textAlign: 'center',
    },
    recordsContainer: {
        flex: 1,
        margin: 20,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        borderRadius: 20,
        overflow: 'hidden',

        // maxHeight: TABLE_MAX_HEIGHT, // restrict the table to 60% device height

        // backgroundColor: Colours.secondaryColour,
    },
    tableHeader: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 2,
        borderColor: '#AAA',
        paddingVertical: 15,
        backgroundColor: Colours.secondaryColour,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    tableBody: {
        flex: 1,
        overflow: 'hidden',
    },

    headerCell: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#DDD',
        paddingVertical: 10,
        backgroundColor: Colours.secondaryColour,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        overflow: 'hidden',

    },
    rowCell: {
        textAlign: 'center',
    },


    // Container for the two cards in a row
    summaryCardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        // or alignItems: 'center' if you want them aligned
    },
    summaryContainer: {
        // padding: 20,
        marginHorizontal: 10,
        // marginVertical: 20,
    },
    summaryText: {
        marginBottom: 6,
    },

    // Each card
    summaryCard: {
        flex: 1,                 // so both cards share space equally
        marginHorizontal: 10,
        backgroundColor: '#fff', // or Colours.whatever
        // borderColor: '',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',    // center text horizontally
        justifyContent: 'center',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        marginTop: 20,
        // width: '48%',
    },

    cardTitle: {
        fontSize: 14,
        fontWeight: 400,
        marginBottom: 8,
        color: 'black',
    },
    cardValue: {
        fontSize: 20,
        color: Colours.buttonColour, // or any accent color
        fontWeight: '700',
    },

    // Chart container
    chartContainer: {
        marginHorizontal: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 700,
        // marginBottom: 8,
        color: 'black',
        // textAlign: 'center',
    },

});
