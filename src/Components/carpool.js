import { useEffect, useRef, useState, useSearchParams } from 'react';
import { useList } from 'react-firebase-hooks/database';
import { updateProfile } from 'firebase/auth';
import { auth } from '../App.js';
import { set, getDatabase, ref, get, onValue, update } from 'firebase/database';

function addUserToParty(user, party){
    const db = getDatabase();
    const partyRef = ref(db, `Carpool/Parties/${party}/Riders`);
    update(partyRef, {
        [user.uid]: {
            displayName: user.displayName,
        }
    });
}

function removeUserFromParty(user, party){
    const db = getDatabase();
    const partyRef = ref(db, `Carpool/Parties/${party}/Riders/${user.uid}`);
    set(partyRef, null);
}

function createParty(seats){
    const db = getDatabase();
    const partyRef = ref(db, `Carpool/Parties/${auth.currentUser.uid}`);
    set(partyRef, {
        Host: auth.currentUser.displayName,
        Seats: seats,
        Closed: false,
        Riders: {}
    });
}

function eraseParty(party){
    const db = getDatabase();
    const partyRef = ref(db, `Carpool/Parties/${party}`);
    set(partyRef, null);
}

function setCloseParty(party, state){
    const db = getDatabase();
    const partyRef = ref(db, `Carpool/Parties/${party}/Closed`);
    set(partyRef, state);
}

function NameInputScreen({ setTab }){
    const submitRef = useRef()
    const [name, setName] = useState(auth.currentUser.displayName);
    
    useEffect(() => {
        const updateUserProfile = () => {
            const input = submitRef.current.previousElementSibling;
            updateProfile(auth.currentUser, {displayName: input.value})
            setName(input.value);
        }
        if(submitRef.current){
            submitRef.current.addEventListener('click', updateUserProfile);
        }
        return () => {
            if (submitRef.current) {
                submitRef.current.removeEventListener('click', updateUserProfile);
            }
        }
    },[submitRef])


    return(
        <div style={{padding: '5%', paddingLeft: '30%', paddingRight: '30%'}}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <h1>{name}</h1>
                <h2 style={{ margin: '5%' }} >Enter your name</h2>
                <input type="text" style={{maxWidth: '100%'}} />
                <button ref={submitRef} style={{margin: '20px', borderRadius: '25px', minWidth: '100%', minHeight: '5vh', color: '#ffffff', backgroundColor: '#1a65c7'}}>Submit</button>
                <button onClick={() => {
                    setTab('carNOS');
                }} style={{margin: '20px', borderRadius: '25px', minWidth: '100%', minHeight: '5vh', color: '#ffffff', backgroundColor: 'rgb(199 128 26)'}}>Continue</button>
            </div>
        </div>
        )
}

function CarNeedOfferScreen({setTab}){
    const [need, setNeed] = useState(null);
    function submitNeed(){
        if(need === null){
            return;
        }
        if(need === 'need'){
            setTab('partySelect');
            return;
        } else {
            setTab('createParty');
            return;
        }
    }

    return(
        <div style={{ padding: '5%', paddingLeft: '30%', paddingRight: '30%' }}>
            {need === 'need' && <h1>We'll get someone to take you</h1>}
            {need === 'offer' && <h1>You'll help us take someone</h1>}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                    style={{ 
                        margin: '10px', 
                        padding: '10px', 
                        border: '1px solid #ccc', 
                        borderRadius: '5px', 
                        width: '100%', 
                        cursor: 'pointer',
                        backgroundColor: need === 'need' ? '#d8e5ff' : 'transparent' 
                    }}
                    onClick={() => setNeed('need')}
                >
                    <span>Need a ride</span>
                    <input type="radio" name='needOffer' value='need' checked={need === 'need'} readOnly style={{ display: 'none' }} />
                </div>
                <div 
                    style={{ 
                        margin: '10px', 
                        padding: '10px', 
                        border: '1px solid #ccc', 
                        borderRadius: '5px', 
                        width: '100%', 
                        cursor: 'pointer',
                        backgroundColor: need === 'offer' ? '#d3e0ff' : 'transparent' 
                    }}
                    onClick={() => setNeed('offer')}
                >
                    <span>Offer a ride</span>
                    <input type="radio" name='needOffer' value='offer' checked={need === 'offer'} readOnly style={{ display: 'none' }} />
                </div>
                <button onClick={() => submitNeed()} style={{ margin: '20px', borderRadius: '25px', minWidth: '100%', minHeight: '5vh', color: '#ffffff', backgroundColor: '#1a65c7' }}>Submit</button>
            </div>
        </div>
    )
}

function CreatePartyScreen({ setTab }){
    const [seats, setSeats] = useState(3);

    return(
        <div style={{ padding: '5%', paddingLeft: '30%', paddingRight: '30%' }}>
            <h1>Create a group</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2>How many extra seats do you have?</h2>
                <input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
                <button onClick={() => {
                    createParty(seats);
                    setTab('myParty');
                }} style={{ margin: '20px', borderRadius: '25px', minWidth: '100%', minHeight: '5vh', color: '#ffffff', backgroundColor: '#1a65c7' }}>Create</button>
            </div>
        </div>
    )
}

function PartySelectScreen({ setTab }){
    const [parties, loading, error] = useList(ref(getDatabase(), 'Carpool/Parties'));
    return(
        <div style={{ padding: '5%', paddingLeft: '30%', paddingRight: '30%' }}>
            <h1>Choose a group</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {parties && parties.map(party => {
                    return(
                        <>
                            {(!party.val().Riders || Object.keys(party.val().Riders).length < party.val().Seats) && !party.val().Closed && <div
                                key={party.key}
                                style={{
                                    margin: '10px',
                                    padding: '10px',
                                    border: '1px solid #ccc',
                                    borderRadius: '5px',
                                    width: '100%',
                                    cursor: 'pointer',
                                    backgroundColor: '#d8e5ff'
                                }}
                                onClick={() => {
                                    addUserToParty(auth.currentUser, party.key);
                                    setTab('main');
                                }}
                            >
                                <span>{party.val().Host}</span>
                            </div>}
                        </>
                    )
                })}
                {!loading && (!parties || parties.length === 0) && <h2>No groups yet :(</h2>}
                {loading && <h2>Loading...</h2>}
            </div>
        </div>
    )
}

function MyPartyScreen({setTab, partyID}){
    const db = getDatabase();
    const [party, setParty] = useState(null);
    
    useEffect(() => {
        const partyRef = ref(db, `Carpool/Parties/${partyID}`);
        onValue(partyRef, (snapshot) => {
            const party = snapshot.val();
            setParty(party);
        });
    },[partyID]);

    return(
        <div style={{ padding: '5%', paddingLeft: '30%', paddingRight: '30%' }}>
            <h1>My Group</h1>
            {party && (
                <>
                    <h2>Host: {party.Host}</h2>
                    <h3>Seats: {party.Seats}</h3>
                    <h3>Riders:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {party.Riders && Object.keys(party.Riders).map(rider => {
                            return(
                                <div 
                                    key={rider} 
                                    style={{ 
                                        margin: '10px', 
                                        padding: '10px', 
                                        border: '1px solid #ccc', 
                                        borderRadius: '5px', 
                                        width: '100%', 
                                        backgroundColor: '#d8e5ff' 
                                    }}
                                >
                                    <span>{party.Riders[rider].displayName}</span>
                                </div>
                            )
                        })}
                        {party.Riders && Object.keys(party.Riders).length < party.Seats && 
                            Array.from({ length: party.Seats - Object.keys(party.Riders).length }).map((_, index) => (
                                <div 
                                    key={`empty-${index}`} 
                                    style={{ 
                                        margin: '10px', 
                                        padding: '10px', 
                                        border: '1px solid #ccc', 
                                        borderRadius: '5px', 
                                        width: '100%', 
                                        backgroundColor: '#f0f0f0' 
                                    }}
                                >
                                    <span>Empty Seat</span>
                                </div>
                            ))
                        }
                        {!party.Riders && Array.from({ length: party.Seats }).map((_, index) => (
                            <div 
                                key={`empty-${index}`} 
                                style={{ 
                                    margin: '10px', 
                                    padding: '10px', 
                                    border: '1px solid #ccc', 
                                    borderRadius: '5px', 
                                    width: '100%', 
                                    backgroundColor: '#f0f0f0' 
                                }}
                            >
                                <span>Empty Seat</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {partyID !== auth.currentUser.uid && 
                        <button onClick={() => {
                            removeUserFromParty(auth.currentUser, partyID);
                            setTab('partySelect');
                        }} 
                        style={{ borderRadius: '25px', minWidth: '100%', minHeight: '5vh', color: '#ffffff', backgroundColor: '#1a65c7' }}
                        >Join another group</button>}

                    {partyID === auth.currentUser.uid && <>
                        {!party.Closed && <button onClick={() => {
                            setCloseParty(partyID, true);
                        }} 
                        style={{ margin: '10px', borderRadius: '25px', minWidth: '70%', minHeight: '5vh', color: '#ffffff', backgroundColor: 'rgb(199 128 26)' }}
                        >Close Group</button>}
                        {party.Closed && <button onClick={() => {
                            setCloseParty(partyID, false);
                        }} 
                        style={{ margin: '10px', borderRadius: '25px', minWidth: '70%', minHeight: '5vh', color: '#ffffff', backgroundColor: '#1a65c7' }}
                        >Open Group</button>}

                        <button onClick={() => {
                            eraseParty(partyID);
                            setTab('carNOS');
                        }} 
                        style={{ margin: '10px', borderRadius: '25px', minWidth: '70%', minHeight: '5vh', color: '#ffffff', backgroundColor: '#a72727' }}
                        >Erase Group</button>
                        </>
                    }
                    </div>
                </>
            )}
        </div>
    )
}

export default function Carpool(){
    const [tab, setTab] = useState('nameInput');

    const [parties, loading, error] = useList(ref(getDatabase(), 'Carpool/Parties'));
    const [party, setParty] = useState(null);
    useEffect(() => {
        if(loading || !parties) return;
        //console.log(parties);
        for(let i = 0; i < parties.length; i++){
            if(parties[i].key === auth.currentUser.uid){
                setTab('myParty');
                setParty(parties[i].key);
                return;
            }
            const riders = parties[i].val().Riders;
            if(riders && riders[auth.currentUser.uid]){
                setTab('myParty');
                setParty(parties[i].key);
                return;
            }
        }
    },[parties, loading])

    return (
        <>
            {tab === 'nameInput' && <NameInputScreen setTab={setTab} />}
            {tab === 'carNOS' && <CarNeedOfferScreen setTab={setTab} />}
            {tab === 'createParty' && <CreatePartyScreen setTab={setTab} />}
            {tab === 'partySelect' && <PartySelectScreen setTab={setTab} />}
            {tab === 'myParty' && <MyPartyScreen setTab={setTab} partyID={party} />}
            {tab === 'main' && <h1>main</h1>}
        </>
    )
}