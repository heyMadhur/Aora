import { Client, Account, ID, Avatars, Databases, Query, Storage } from 'react-native-appwrite';

export const appwriteConfig = {
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
const avatars = new Avatars(client)
const databases = new Databases(client)
const storage= new Storage(client)

export default client; // Export client for other usages

export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, username)
        if (!newAccount) throw new Error("Account Creation Failed")

        const avatarUrl = avatars.getInitials(username);
        await signIn(email, password)

        // Create new User in Database after sign in
        const newUser = await databases.createDocument(appwriteConfig.databaseID, appwriteConfig.userCollectionId, ID.unique(), {
            accountId: newAccount.$id,
            email,
            username,
            avatar: avatarUrl
        })

        return newUser

    } catch (error) {
        console.log("Create User Error", error)
        throw new Error(error)
    }
}

export const signIn = async (email, password) => {
    try {
        let session;
        try {
            // Check if a session already exists
            session = await account.getSession('current');

            if (session) {
                // If a session exists, you may either return the existing session
                return session;
            }
        } catch (error) {
            // If there is no current session, an error will be thrown, and you can proceed to create a new session
            session = await account.createEmailPasswordSession(email, password)
        }
        return session
    }
    catch (error) {
        console.error('Sign In Error:', error);
        throw error;
    }
}

export const getCurrentUser = async () => {
    try {
        // Check if a session already exists
        const currentAccount = await account.get();
        console.log(1)
        
        if (!currentAccount) throw new Error('No current account found');
        console.log(2)
        
        const currentUser = await databases.listDocuments(appwriteConfig.databaseID, appwriteConfig.userCollectionId, [Query.equal('accountId', currentAccount.$id)])
        console.log(3)
        
        if (!currentUser) throw new Error('User not found in database');
        console.log(4)
        return currentUser.documents[0]

    } catch (error) {
        // If there is no current session, an error will be thrown, and you can proceed to create a new session
        console.error('Get Current User Error:', error);
        throw error;
    }
}

export const getAllPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID, appwriteConfig.videoCollectionId, [Query.orderDesc('$createdAt')]
        )

        return posts.documents;
    } catch (error) {
        console.error('Get All Posts Error:', error);
        throw error;
    }
}

export const getLatestPost = async () => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID, appwriteConfig.videoCollectionId, [Query.orderDesc('$createdAt', Query.limit(7))]
        )

        return posts.documents;
    } catch (error) {
        console.error('Get Latest Post Error:', error);
        throw error;
    }
}

export const searchPosts = async (query) => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID, appwriteConfig.videoCollectionId, [Query.search('title', query)]
        )

        return posts.documents;
    } catch (error) {
        console.error('Get Search Post Error:', error);
        throw error;
    }
}

export const getUserPosts = async (userId) => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseID, appwriteConfig.videoCollectionId, [Query.equal('creator', userId)]
        )

        return posts.documents;
    } catch (error) {
        console.error('Get User Post Error:', error);
        throw error;
    }
}

export const signOut= async() => {
    try {
        const session= await account.deleteSession('current')
        return session
    } catch (error) {
        throw new Error (error)
    }
}

export const getFilePreview= async(fileId, type) => {
    let fileUrl;

    try {
        if(type=== 'video') {
            fileUrl= storage.getFileView(appwriteConfig.storageId, fileId)
        } else if(type==='image') {
            
            fileUrl= storage.getFilePreview(appwriteConfig.storageId, fileId, 2000, 2000, 'top', 100)
        } else {
            throw new Error('Invalid File type')
        }

        if(!fileUrl) throw Error

        return fileUrl

    } catch (error) {
        throw new Error (error)
        
    }
}

export const uploadFile=async (file, type)=>{
    if(!file) return

    const {mimeType, ...rest} = file;
    // Reconstruct the File according to Appwrite
    const asset= { type: mimeType, ...rest}

    try {
        const uploadedFile= await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            asset
        )

        const fileUrl= await getFilePreview(uploadedFile.$id, type)

        return fileUrl

    } catch (error) {
        throw new Error(error)
    }
}

export const createVideo= async (form)=>{
    try {
        const [thumbnailUrl, videoUrl]= await Promise.all([
            uploadFile(form.thumbnail, 'image'),
            uploadFile(form.video, 'video'),
        ])

        const newPost= await databases.createDocument(appwriteConfig.databaseID, appwriteConfig.videoCollectionId, ID.unique(), {
            title: form.title, 
            thumbnail: thumbnailUrl,
            video: videoUrl,
            prompt: form.prompt,
            creator: form.userId
        })
        return newPost

    } catch (error) {
        throw new Error(error)
        
    }
}