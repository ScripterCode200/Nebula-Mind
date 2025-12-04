# Survival Guide: Dashboard & Gamification System

This document details the logic, measurement, and importance of every metric found on the User Dashboard and Profile.

## 1. Study Streak ⚡
**What is it?**
A counter representing the number of consecutive days you have logged in and studied.

**How is it measured?**
- **Trigger**: The "Heartbeat" system runs every minute while the app is open.
- **Logic**: The server compares your `lastLoginDate` with the current date (adjusted for your local Timezone).
    - If `lastLoginDate` == `Yesterday`: Streak increments (+1).
    - If `lastLoginDate` == `Today`: Streak stays the same.
    - If `lastLoginDate` < `Yesterday`: Streak resets to 1.

**Importance:**
Builds a daily learning habit. Consistency is the key to mastering complex subjects.

---

## 2. Time Focused ⏳
**What is it?**
The total accumulated time you have spent actively using the application.

**How is it measured?**
- **Trigger**: A client-side "Heartbeat" pings the server every **60 seconds**.
- **Visibility Check**: The ping is ONLY sent if the tab is **active** (`document.visibilityState === 'visible'`). This prevents "farming" time by leaving a tab open in the background.
- **Rate Limit**: The server accepts only 1 heartbeat per 55 seconds to prevent multi-tab double counting.

**Importance:**
A raw measure of your dedication and effort. Unlike XP, this cannot be "gamed" easily—it requires actual presence.

---

## 3. Knowledge Score (XP) ⭐
**What is it?**
Experience Points (XP) represent your engagement and productivity within the platform.

**How is it measured?**
You earn XP for various actions:
- **Study Time**: 5 XP per minute (Passive).
- **Create Notebook**: 50 XP (Active).
- **Complete Mock Test**: 100 XP (Active).
- **Create Flashcards**: 30 XP (Active).
- **Chat with AI**: 5 XP per message (Active).

**Importance:**
Gamifies the learning process. It rewards both passive study and active creation, encouraging you to explore all features.

---

## 4. Knowledge Growth Chart 📈
**What is it?**
A visual graph on the dashboard showing your XP gain and Time Spent over the last 30 days.

**How it works:**
- **Storage**: The database maintains a `dailyStats` array in your User profile.
- **Update**: Every time you earn XP or log time, the entry for "Today" (YYYY-MM-DD) is updated.
- **Rolling Window**: To keep the database fast, we only store the last **30 days** of history. Older days are dropped.

**Importance:**
Provides visual feedback on your momentum. Seeing the line go up motivates you to maintain your pace.

---

## 5. Recent Activity 🕒
**What is it?**
A feed of your last 5 significant actions.

**How it works:**
- **Storage**: A separate `ActivityLog` collection stores every significant event (`create_notebook`, `complete_test`, etc.).
- **Retention**: Logs are automatically deleted after **90 days** (TTL Index) to save space.
- **Display**: The dashboard fetches the 5 most recent logs.

**Importance:**
Allows you to quickly resume where you left off and review your recent accomplishments.

---

## 6. Achievements 🏆
**What is it?**
Permanent badges unlocked by reaching specific milestones.

**How it works:**
- **Check**: Every time you perform an action (or send a heartbeat), the server checks if you meet the criteria for any locked achievements.
- **Unlock**: If met, the achievement ID and timestamp are added to your profile.
- **Notification**: The frontend detects the new achievement and shows a celebratory popup.

**Current Achievements:**
- **Creator**: Create your first notebook.
- **Prolific**: Create 5 notebooks.
- **Quiz Whiz**: Complete 3 mock tests.
- **Focused**: Study for 1 hour total.
- **Consistent**: Reach a 3-day streak.
- **Scholar**: Earn 1000 XP.

**Importance:**
Provides long-term goals and "surprise and delight" moments to keep you engaged over weeks or months.
