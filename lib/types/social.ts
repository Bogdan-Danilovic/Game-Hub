import { Timestamp } from 'firebase/firestore'

export interface FriendRequest {
  id: string
  from: string
  to: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Timestamp
}

export interface FriendProfile {
  uid: string
  name: string
  avatar: string
  color: string
  isOnline: boolean
  lastSeen: Timestamp
}

/*
Firestore Security Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // friendRequests/{requestId}
    // - sender can create (from == their uid, status must be 'pending')
    // - either party can read
    // - only recipient can update status (accept / decline)
    // - neither party can delete
    match /friendRequests/{requestId} {
      allow create: if request.auth != null
                    && request.resource.data.from == request.auth.uid
                    && request.resource.data.status == 'pending';

      allow read: if request.auth != null
                  && (resource.data.from == request.auth.uid
                      || resource.data.to == request.auth.uid);

      allow update: if request.auth != null
                    && resource.data.to == request.auth.uid
                    && request.resource.data.status in ['accepted', 'declined']
                    && request.resource.data.from == resource.data.from
                    && request.resource.data.to   == resource.data.to;

      allow delete: if false;
    }

    // friendProfiles/{uid}
    // - any authenticated user can read (needed for friend list display)
    // - only the owner can write
    match /friendProfiles/{uid} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
*/
