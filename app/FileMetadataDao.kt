package com.example.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface FileMetadataDao {
    // Starred Files
    @Query("SELECT * FROM starred_files ORDER BY addedAt DESC")
    fun getAllStarred(): Flow<List<StarredFileEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM starred_files WHERE path = :path)")
    suspend fun isStarred(path: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addStarred(starred: StarredFileEntity)

    @Query("DELETE FROM starred_files WHERE path = :path")
    suspend fun removeStarred(path: String)

    // File Tags
    @Query("SELECT * FROM file_tags WHERE path = :path")
    fun getTagsForFile(path: String): Flow<List<FileTagEntity>>

    @Query("SELECT * FROM file_tags")
    fun getAllTags(): Flow<List<FileTagEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addTag(fileTag: FileTagEntity)

    @Query("DELETE FROM file_tags WHERE path = :path AND tag = :tag")
    suspend fun removeTag(path: String, tag: String)

    @Query("DELETE FROM file_tags WHERE path = :path")
    suspend fun clearTagsForFile(path: String)

    // Trash Items
    @Query("SELECT * FROM trash_items ORDER BY deletedAt DESC")
    fun getAllTrashItems(): Flow<List<TrashItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addTrashItem(trashItem: TrashItemEntity)

    @Query("DELETE FROM trash_items WHERE trashPath = :trashPath")
    suspend fun removeTrashItem(trashPath: String)

    @Query("DELETE FROM trash_items")
    suspend fun clearAllTrash()

    // Recent Files
    @Query("SELECT * FROM recent_files ORDER BY accessedAt DESC LIMIT 25")
    fun getRecentFiles(): Flow<List<RecentFileEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun recordAccess(recent: RecentFileEntity)

    @Query("DELETE FROM recent_files WHERE path = :path")
    suspend fun removeRecent(path: String)
}
