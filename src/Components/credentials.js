import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, deleteUser , updateProfile} from "firebase/auth";
import './credentials.css';
import { getDatabase, goOffline, goOnline } from "firebase/database";

function randomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function createName() {
    const prefixes = ['Super', 'Mega', 'Ultra', 'Hyper', 'Giga', 'Tera', 'Peta', 'Exa', 'Zetta', 'Yotta'];
    const animals = ['Cat', 'Dog', 'Bird', 'Fish', 'Horse', 'Cow', 'Pig', 'Sheep', 'Goat', 'Chicken'];

    return randomElement(prefixes) + randomElement(animals);
}

export function SignIn() {
    return (
        <>
        <div className="signin-background">
            <div className="signin-container">
                <h1>Sign in with Google</h1>
                <button className="signin-button" onClick={_GoogleSignIn}>Click me!</button>
            </div>
            <div className="signin-container">
                <h1>Sign in Anonymously</h1>
                <button className="signin-button" onClick={_AnonymousSignIn}>Click me!</button>
            </div>
        </div>
        </>
    );
}

export function LogOut() {
    return (
        <>
        <div className="logout-background">
            <div className="logout-container">
                <button className="logout-button" onClick={_logout}>Log out</button>
            </div>
        </div>
        </>
    );
}



function _GoogleSignIn() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            //const credential = GoogleAuthProvider.credentialFromResult(result);
            //const token = credential.accessToken;
            //const user = result.user;
            //console.log(user);
        }).catch((error) => {
            //const errorCode = error.code;
            //const errorMessage = error.message;
            //const email = error.email;
            //const credential = GoogleAuthProvider.credentialFromError(error);
            console.log(error);
        }, []);
  
  auth.onAuthStateChanged( user => {
        if (user) {
            console.log('GUser signed in');
        } else {
            console.log('GUser signed out');
        }
  });
}

function _AnonymousSignIn() {
    const auth = getAuth();
    signInAnonymously(auth)
        .then((result) => {
            //const user = result.user;
            updateProfile(auth.currentUser, {
                displayName: createName()
            })
        }
    ).catch((error) => {
        //const errorCode = error.code;
        //const errorMessage = error.message;
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Anon User signed in');
        } else {
            console.log('Anon User signed out');
        }
  });
}

function _logout() {
    const auth = getAuth();
    const user = auth.currentUser;

    // Disconnect from the database before signing out
    goOffline(getDatabase());
    goOnline(getDatabase());

    if (user.isAnonymous) {
        deleteUser(user).then(() => {
            console.log('Anon User deleted');
        }).catch((error) => {
            console.log(error);
        });
    }

    auth.signOut().then(() => {
        console.log('User signed out');
    }).catch((error) => {
        console.log(error);
    });

    window.location.reload();
}

