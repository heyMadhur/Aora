import { Client, Account, ID, Avatars, Databases, Query } from 'react-native-appwrite';

export const appwriteConfig= {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: 'com.americans.aora',
    projectId: "666a71d8000af322e111",
    databaseID: "666a755900040e162143",
    userCollectionId: "666a75800004f0595eb5",
    videoCollectionId: "666a759a0027a7ee0422",
    storageId: "666a76b1000d9cb065c6"
}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
    .setProject(appwriteConfig.projectId) // Your project ID
    .setPlatform(appwriteConfig.platform) // Your application ID or bundle ID.
;

const account = new Account(client);
const avatars= new Avatars(client)
const databases= new Databases(client)

export const createUser= async(email, password, username)=>{
    try{
        const newAccount= await account.create(ID.unique(), email, password, username)
        if(!newAccount) throw Error
        const avatarUrl= avatars.getInitials(username);
        await signIn(email, password)

        // Create new User in Database after sign in
        const newUser= await databases.createDocument(appwriteConfig.databaseID, appwriteConfig.userCollectionId, ID.unique(), {
            accountId: newAccount.$id,
            email,
            username,
            avatar: avatarUrl
        })

        return newUser

    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

export const signIn= async(email, password) => {
    try {
        // Check if a session already exists
        const currentSession = await account.getSession('current');
    
        if (currentSession) {
          // If a session exists, you may either return the existing session
          return currentSession;
        }
      } catch (error) {
        // If there is no current session, an error will be thrown, and you can proceed to create a new session
        throw new Error (error)
      }
    try{
        const session= await account.createEmailPasswordSession(email, password)

        return session

    } catch (error) {
        throw new Error (error)
    }
}

export const getCurrentUser= async() =>{
    try {
        // Check if a session already exists
        const currentAccount = await account.get();
    
        if (!currentAccount) throw Error
        
        const currentUser= await databases.listDocuments(appwriteConfig.databaseID, appwriteConfig.userCollectionId, [Query.equal('accountId', currentAccount.$id)])

        if(!currentUser) throw Error
        return currentUser.documents[0]

      } catch (error) {
        // If there is no current session, an error will be thrown, and you can proceed to create a new session
        throw new Error (error)
      }
}