# JavaScript Function Inventory

Generated: 2026-03-27

Phase 4 note: standalone admin-page alignment now includes local authFetch wrappers on loop and melodic managers plus read-only action guards; per-file function totals may differ from earlier snapshots.

This is one of the three canonical documentation files for the current codebase.

- Scope: All active `.js` files excluding `backups/` and `node_modules/`.
- Total files: 70
- Total extracted functions and methods: baseline 594 before Phase 2 shared-helper extraction
- Largest files by function count:
	- main.js: 276
	- loop-rhythm-manager.js: 50
	- loop-player-pad.js: 38
	- server.js: 31
	- loop-manager.js: 23

Use this document for exhaustive lookup. Use docs/CODEBASE_GUIDE.md for architecture and docs/CODE_ISSUES_AND_DUPLICATION.md for cleanup priorities.

## Per-File Inventory

### api-test.js
- Total: 2 (Declared: 2, Class methods: 0)
- Functions: checkAPI, makeRequest

### api/index.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### scripts/core/api-base.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: resolve

### scripts/core/auth-client.js
- Total: 9 (Declared: 9, Class methods: 0)
- Functions: authFetch, clearSession, configure, defaultHandleMissingToken, defaultHandleUnauthorized, getAuthHeaders, getToken, hasToken, setToken

### scripts/features/auth-ui.js
- Total: 7 (Declared: 7, Class methods: 0)
- Functions: hideAuthModals, login, logout, register, showLoginModal, showRegisterModal, updateAuthButtons

### scripts/features/password-reset.js
- Total: 8 (Declared: 8, Class methods: 0)
- Functions: hidePasswordResetModals, initiatePasswordReset, resendOtp, setupPasswordResetEventListeners, showForgotPasswordModal, showOtpVerificationModal, showPasswordResetNotification, verifyOtpAndResetPassword

### scripts/features/songs-ui.js
- Total: 4 (Declared: 4, Class methods: 0)
- Functions: debouncedRenderSongs, loadSongsFromFile, renderSongs, updateSongCount

### scripts/features/song-crud-ui.js
- Total: 7 (Declared: 7, Class methods: 0)
- Functions: deleteSongById, editSong, findSongById, handleDeleteSongConfirm, handleEditSongSubmit, hideDeleteSongModal, openDeleteSongModal

### scripts/features/song-preview-ui.js
- Total: 18 (Declared: 18, Class methods: 0)
- Functions: applyLyricsBackground, extractDistinctChords, formatLyricsWithChords, getDisplayName, handleUserScroll, hasInlineChords, hideFloatingStopButton, initializeFloatingStopButton, isChordLine, setupAutoScroll, showFloatingStopButton, showPreview, startAutoScroll, stopCurrentlyPlayingSong, toggleAutoScroll, transposeChord, transposeSingleChord, updatePreviewWithTransposition

### scripts/features/setlists.js
- Total: 51 (Declared: 51, Class methods: 0)
- Functions: addManualSongToSetlist, addSongToCurrentSetlist, addToSpecificSetlist, attachSetlistEventListeners, checkSongInSetlistAndToggle, clearSetlistSelections, closeDropdownMenu, createGlobalSetlist, createMySetlist, createSetlistSongElement, deleteGlobalSetlist, deleteMySetlist, displaySetlistSongs, editGlobalSetlist, editMySetlist, handleDropdownArrowClick, handleDropdownMainAreaClick, hideSetlistDescription, initializeSetlistSongSelection, isSongInCurrentSetlist, loadGlobalSetlists, loadMySetlists, openDropdownMenu, populateSetlistDropdown, populateSetlistDropdownForSong, refreshSetlistDataAndUI, refreshSetlistDataOnly, refreshSetlistDisplay, registerGlobals, removeFromCurrentSetlist, removeFromSpecificSetlist, removeSongFromSetlist, renderGlobalSetlists, renderMySetlists, renderSetlists, renderSetlistSongs, selectDropdownOption, selectExistingSong, setupCustomDropdownHandlers, showDropdownSetlistDescription, showGlobalSetlistInMainSection, showMySetlistInMainSection, showSetlistDescription, updateAllSetlistButtonStates, updateCustomDropdownDisplay, updatePreviewSetlistButton, updateSetlistButton, updateSetlistButtonState, updateSetlistDropdownStyle

### scripts/features/smart-setlists.js
- Total: 19 (Declared: 19, Class methods: 0)
- Functions: createSmartSetlist, createSmartSetlistWithSongs, deleteSmartSetlist, displayScanResults, editSmartSetlist, getDropdownElementForInput, getSmartSetlistConditions, initializeSmartSetlistMultiselects, initializeSmartSetlistUI, loadSmartSetlistsFromServer, renderSmartSetlists, renderSmartSongsList, scanSongsWithConditions, setupMultiselect, setupSmartSongTabs, showSmartSetlistInMainSection, updateSelectedDisplay, updateSmartSetlist, updateSmartSetlistForm

### scripts/features/rhythm-sets.js
- Total: 7 (Declared: 7, Class methods: 0)
- Functions: createRhythmSetFromForm, initializeRhythmSetsUI, loadRhythmSets, recomputeRhythmSetRow, renderRhythmSetsTable, saveRhythmSetRow, showRhythmSetsNotification

### scripts/features/admin-ui.js
- Total: 13 (Declared: 13, Class methods: 0)
- Functions: fetchRecommendationWeights, fetchUsers, initializeAdminUI, loadUsers, loadWeightsToForm, markAdmin, registerGlobals, removeAdminRole, renderUsers, saveRecommendationWeightsToBackend, showAdminNotification, showAdminPanelModal, updateWeightsTotalBar

### scripts/features/mobile-ui.js
- Total: 5 (Declared: 5, Class methods: 0)
- Functions: addMobileTouchNavigation, createMobileNavButtons, initializeMobileUI, makeToggleDraggable, updatePositions

### scripts/shared/admin-page.js
- Total: 5 (Declared: 5, Class methods: 0)
- Functions: createAudioPreviewController, disableInteraction, showAlert, showAuthenticationWarnings, showHtmlAlert

### scripts/shared/chord-normalization.js
- Total: 7 (Declared: 7, Class methods: 0)
- Functions: createChordNormalization, initializeChordNormalization, normalizeBaseNote, normalizeChordToken, normalizeKeySignature, normalizeManualChords, normalizeSongAccidentals

### scripts/shared/dom.js
- Total: 9 (Declared: 9, Class methods: 0)
- Functions: closeModal, highlightText, initializeDomUI, openModal, saveSearchQuery, setupModalClosing, setupModals, setupSuggestedSongsClosing, showSearchHistory

### scripts/shared/rhythm-set.js
- Total: 8 (Declared: 8, Class methods: 0)
- Functions: buildRhythmSetId, createRhythmSetUtils, deriveRhythmSetFields, initializeRhythmSetUtils, normalizeRhythmCategory, normalizeRhythmFamily, normalizeRhythmSetNo, parseRhythmSetId

### check-setlists.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: checkSetlists

### check-songs-collection.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: checkSongsCollection

### create-test-setlist.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: createTestSetlist

### debug-data-types.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: debugDataTypes

### debug-db.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: debugDatabase

### debug-smartsetlists.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: debugSmartSetlists

### debug-test.js
- Total: 2 (Declared: 2, Class methods: 0)
- Functions: checkDebug, makeRequest

### final_chord_test.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### fix-duplicate-song-ids.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: fixDuplicateSongIds

### fix-powerful-spelling.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: fixPowerfulSpelling

### loop-manager.js
- Total: 23 (Declared: 23, Class methods: 0)
- Functions: buildRhythmSetId, deleteLoop, displayLoops, getSlotId, handleIndividualUpload, handleReplaceFile, handleUpload, isAuthenticated, loadLoopsMetadata, loadSongMetadata, normalizeRhythmFamily, playAudio, populateDropdowns, replaceLoop, resolveApiBaseUrl, resolveLoopRhythmSetId, setupEventListeners, showAlert, showAuthenticationWarning, syncTaalWithRhythmFamily, updateFilenamePreview, updateStats, uploadSingleFile

### loop-player-pad-soundtouch.js
- Total: 14 (Declared: 0, Class methods: 14)
- Functions: _extractSamples, _playWithSoundtouch, _prepareSoundtouchNode, destroy, getState, initialize, loadLoops, pause, play, playFill, setAutoFill, setPlaybackRate, setVolume, switchToLoop

### loop-player-pad-tonejs.js
- Total: 12 (Declared: 0, Class methods: 12)
- Functions: _playLoop, destroy, getState, initialize, loadLoops, pause, play, playFill, setAutoFill, setPlaybackRate, setVolume, switchToLoop

### loop-player-pad-ui.js
- Total: 14 (Declared: 14, Class methods: 0)
- Functions: areTimeSignaturesEquivalent, cleanupLoopPlayer, findMatchingLoopSet, getEffectiveKey, getLoopPlayerHTML, getLoopsMetadata, getTransposeLevel, initializeLoopPlayer, invalidateLoopsMetadataCache, normalizeKeyName, parseLoopRhythmSetId, shouldShowLoopPlayer, toggleLoopPlayer, updateMelodicPadAvailability

### loop-player-pad.js
- Total: 38 (Declared: 0, Class methods: 38)
- Functions: _applyPendingReload, _decodeAudioData, _decodeLoadedSamples, _decodeMelodicSample, _getEffectiveKey, _getMelodicBaseUrl, _initializeAllSamples, _initializeMelodicSamples, _initializeRhythmSamples, _initializeSilent, _normalizeKeyName, _playLoop, _restoreVolumeFromSilent, _scheduleCrossfadeLoop, _startCrossfadeLoop, _startMelodicPad, _stopAllMelodicPads, _stopMelodicPad, _toggleMelodicPad, checkMelodicAvailability, destroy, getState, initialize, loadLoops, loadMelodicSamples, needsLoopReload, pause, play, playFill, setAutoFill, setMelodicVolume, setPlaybackRate, setSongKeyAndTranspose, setVolume, stopAllMelodicPads, switchToLoop, toggleAtmosphere, toggleTanpura

### loop-player-ui.DEPRECATED.js
- Total: 16 (Declared: 16, Class methods: 0)
- Functions: addToPattern, cleanupLoopPlayer, deleteLoopFile, formatLoopType, getLoopPlayerHTML, handleLoopFileUpload, handleTempoChange, handleVolumeChange, initializeLoopPlayer, removeFromPattern, savePattern, setTempo, toggleLoopPlayerExpanded, togglePlayPause, updateLoopStatus, updatePatternDisplay

### loop-player.js
- Total: 13 (Declared: 0, Class methods: 13)
- Functions: destroy, getState, initialize, loadLoops, pause, play, playLoop, playNextInPattern, setPattern, setPlaybackRate, setVolume, stopCurrentSource, togglePlayPause

### loop-rhythm-manager.js
- Total: 50 (Declared: 50, Class methods: 0)
- Functions: applyReadOnlyModeUI, authFetch, buildRhythmSetId, buildRhythmSetsFromMetadata, closeEditModal, closeLoopPlayer, createRhythmSet, createSimplePlayerUI, deleteRhythmSet, editRhythmSet, escapeHtml, forceDeleteRhythmSet, handleDragLeave, handleDragOver, handleDrop, handleRhythmFamilySelect, loadPublicRhythmSetsFromMetadata, loadRhythmSetIntoPlayer, loadRhythmSets, normalizeRhythmFamily, openLoopPlayer, openQuickSetPlayer, parseRhythmSetParts, playLoop, playLoopPad, playQuickLoop, populateRhythmFamilyList, previewLoops, removeLoop, renderLoopSlots, renderRhythmSetsTable, resolveApiBaseUrl, saveRhythmSetEdit, setupQuickPlayListeners, setupRhythmFamilyListener, showAlert, showExistingLoops, startPlayer, stopPlayer, toggleAutoFill, toggleExpandRow, updateAvailableSetNumbers, updateEditPreview, updateQuickLoopOptions, updateQuickPlayControls, updateRhythmSetPreview, updateTempo, updateVolume, uploadFileForLoop, uploadSingleLoop

### main.js
- Total: 276 (Declared: 276, Class methods: 0)
- Functions: addEventListeners, addGlobalClickListener, addGlobalKeyListener, addManualSongToSetlist, addMobileTouchNavigation, addPanelToggles, addSongToCurrentSetlist, addToGlobalSetlist, addToMySetlist, addToSpecificSetlist, animateScroll, applyFilters, applyLyricsBackground, applyTheme, applyToggleButtonsVisibility, attachPreviewEventListeners, attachSetlistEventListeners, authFetch, buildRhythmSetIdValue, cachedFetch, capitalizeFirst, categorizeSongs, checkSongInSetlistAndToggle, cleanChordName, clearSelection, clearSetlistSelections, closeAddManualSongModal, closeDropdownMenu, closeModal, closeSuggestedSongsDrawer, createGlobalSetlist, createMobileNavButtons, createMySetlist, createRhythmSetFromForm, createSetlistSongElement, createSmartSetlist, createSmartSetlistWithSongs, createSongItem, debouncedRenderSongs, deleteGlobalSetlist, deleteListener, deleteMySetlist, deleteSmartSetlist, deleteSongById, displayScanResults, displaySetlistSongs, divListener, downloadSongs, editGlobalSetlist, editListener, editMySetlist, editSmartSetlist, editSong, extractDistinctChords, favListener, fetchRecommendationWeights, fetchUsers, filterAndDisplaySongs, findSongById, formatLyricsWithChords, getCurrentFilterValues, getCurrentSongList, getDisplayName, getGenreMatchScore, getJwtExpiry, getLanguageMatchScore, getLanguagesFromGenres, getMoodMatchScore, getMoodTags, getNonLanguageGenres, getNonVocalGenres, getRootNote, getSelectedSongs, getSelections, getSmartSetlistConditions, getSongRhythmSetId, getSuggestedSongs, getTempoSimilarity, getVocalMatchScore, getVocalTags, goBackToSidebar, handleDropdownArrowClick, handleDropdownMainAreaClick, handleFileUpload, handleManualSongSubmit, handleMergeUpload, handleSelectAll, handleSetlistClick, handleSongTitleSearch, handleSwipeGesture, handleUserScroll, hasInlineChords, hideAuthModals, hideFloatingStopButton, hideLoading, hidePasswordResetModals, hideSetlistDescription, highlightText, hydrateRhythmFamilies, initializeFilters, initializeFloatingStopButton, initializeSetlistSongSelection, initializeSmartSetlistMultiselects, initializeTabs, initiatePasswordReset, initScreenWakeLock, insertTextAtCursor, invalidateCache, isAdmin, isCacheFresh, isChordLine, isDuplicateSong, isJwtValid, isMajor, isMinor, isSameScaleType, isSongInCurrentSetlist, loadGlobalSetlists, loadMySetlists, loadRhythmSets, loadSettings, loadSmartSetlistsFromServer, loadSongsFromFile, loadSongsWithProgress, loadUserData, loadUsers, loadWeightsToForm, login, logout, makeToggleDraggable, markAdmin, normalizeBaseNote, normalizeChordAccidentals, normalizeKeySignature, normalizeRhythmCategoryValue, normalizeRhythmFamilyValue, normalizeSingleChordToken, normalizeSongAccidentals, onEnd, onMouseDown, onMouseMove, onMove, onTouchMove, onTouchStart, openAddManualSongModal, openAddSong, openDeleteSongModal, openDropdownMenu, openModal, openSetlistView, optimizeMemoryUsage, performInitialization, populateDropdown, populateGenreDropdown, populateMultiselect, populateRhythmCategoryDropdown, populateRhythmFamilyDropdown, populateRhythmSetDropdown, populateSetlistDropdown, populateSetlistDropdownForSong, prefetchData, queueSaveUserData, recomputeRhythmSetRow, redrawPreviewOnThemeChange, refreshSetlistDataAndUI, refreshSetlistDataOnly, refreshSetlistDisplay, register, removeAdminRole, removeFromCurrentSetlist, removeFromGlobalSetlist, removeFromMySetlist, removeFromSpecificSetlist, removeSongFromSetlist, renderDeleteSongs, renderFavorites, renderGlobalSetlists, renderMultiselectOptions, renderMySetlists, renderResequencableList, renderRhythmSetsTable, renderSetlists, renderSetlistSongs, renderSmartSetlists, renderSmartSongsList, renderSongList, renderSongLists, renderSongs, renderUsers, resendOtp, resetApplicationState, restoreNormalView, restorePosition, savePosition, saveRecommendationWeightsToBackend, saveRhythmSetRow, saveSearchQuery, saveSettings, saveSongs, saveUserData, scanSongsWithConditions, schedulePrefetch, selectDropdownOption, selectExistingSong, setlistListener, setSelectedSongs, setupAutoScroll, setupCustomDropdownHandlers, setupModalClosing, setupModals, setupMultiselect, setupPasswordResetEventListeners, setupSearchableMultiselect, setupSmartSongTabs, setupSongStructureTags, setupSuggestedSongsClosing, setupTapTempo, setupWindowCloseConfirmation, showAdminNotification, showAdminPanelModal, showDropdownSetlistDescription, showFloatingStopButton, showForgotPasswordModal, showGlobalSetlistInMainSection, showLoading, showLoginModal, showMySetlistInMainSection, showNotification, showOtpVerificationModal, showPasswordResetNotification, showPreview, showRegisterModal, showRhythmSetsNotification, showSearchHistory, showSetlistDescription, showSmartSetlistInMainSection, showSuggestedSongs, showTemporarily, snapToEdge, startAutoScroll, stopCurrentlyPlayingSong, stringSimilarity, toggleAutoScroll, toggleFavorite, toggleScreenWakeLock, toggleSuggestedSongsDrawer, toggleTheme, transposeChord, transposeSingleChord, updateAllSetlistButtonStates, updateAuthButtons, updateCustomDropdownDisplay, updateLocalTransposeCache, updatePositions, updatePreviewSetlistButton, updatePreviewWithTransposition, updateProgress, updateRhythmSetIdPreview, updateSearchableInput, updateSelectAllState, updateSelectAllStates, updateSelectedDisplay, updateSelectedMultiselect, updateSelectedSongsDisplay, updateSetlistButton, updateSetlistButtonState, updateSetlistDropdownStyle, updateSmartSetlist, updateSmartSetlistForm, updateSongCount, updateSongInCache, updateTaalDropdown, updateThemeToggleBtn, updateWeightsTotalBar, verifyOtpAndResetPassword, WEIGHTS

### melodic-loops-manager.js
- Total: 16 (Declared: 16, Class methods: 0)
- Functions: deleteFile, displayFiles, handleFileSelect, handleReplaceFile, isAuthenticated, loadMelodicFiles, playAudio, replaceMelodicFile, resetUploadInputs, selectKey, setupEventListeners, showAlert, showAuthenticationWarning, updateCurrentFileDisplay, updateStats, uploadFile

### migrate-chord-accidentals.js
- Total: 13 (Declared: 13, Class methods: 0)
- Functions: normalizeBaseNote, normalizeChordToken, normalizeCollectionSongs, normalizeKeySignature, normalizeLyricsChords, normalizeManualChords, normalizeSetlists, normalizeSongLike, normalizeSongsArrayForSetlist, normalizeUserSongKeys, pickSongFields, run, songFieldsChanged

### migrate-genres-to-moods.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: migrateGenresToMoods

### migrate-loops-to-set-naming.js
- Total: 2 (Declared: 2, Class methods: 0)
- Functions: newFilename, newId

### migrate-moods.js
- Total: 2 (Declared: 2, Class methods: 0)
- Functions: dryRunMigration, migrateMoods

### migrate-smart-setlists-admin-flag.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: migrateSmartSetlists

### migrate-song-ids.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: migrateSongIds

### migrate-users-isadmin-to-boolean.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: migrateUsers

### normalize-loop-data.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: normalizeData

### rhythm-mapper.js
- Total: 17 (Declared: 17, Class methods: 0)
- Functions: assignRhythmSet, authFetch, clearSelection, clearSongMapping, escapeHtml, filterSongs, loadRhythmSets, loadSongs, populateFilters, populateRhythmSetSelect, renderSongsTable, selectAllSongs, showAlert, toggleAllCheckboxes, toggleSongSelection, unassignRhythmSet, updateHeaderCheckbox

### rhythm-sets-manager.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### server.js
- Total: 31 (Declared: 31, Class methods: 0)
- Functions: authMiddleware, bootstrapRhythmSetsFromMetadata, buildRhythmSetId, buildRhythmSetIndexFromMetadata, cap, connectToDatabase, ensureRhythmSetDocument, expandKeyFilterVariants, findExistingMelodicFile, getLoopRhythmFields, getSongGenreList, getTempoCategoryFromValue, isEquivalentTimeSignature, normalizeBaseNote, normalizeChordToken, normalizeKeySignature, normalizeLyricsChords, normalizeManualChords, normalizeMelodicKey, normalizeRhythmCategory, normalizeRhythmFamily, normalizeRhythmSetNo, normalizeSongAccidentals, parseRhythmSetId, readLoopsMetadataSafe, recommendRhythmSetForSong, recomputeRhythmSetDerivedMetadata, renameRhythmSetInLoopsMetadata, requireAdmin, resolveSongRhythmSelection, startLocalServer

### service-worker.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### setup-git-hooks.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### static-server.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### test-admin-endpoints.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: testAdminEndpoints

### test-api.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: testAPI

### test-atmosphere-G-specific.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### test-atmosphere-mobile.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### test-jwt-validation.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### test-login.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: login

### test-mood-recommendations.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: testMoodRecommendations

### test-setlist-creation.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: testCreateSetlist

### update-genres.js
- Total: 2 (Declared: 2, Class methods: 0)
- Functions: cleanGenres, dryRunCleanup

### update.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: updateAllSongs

### utils/auth.js
- Total: 12 (Declared: 12, Class methods: 0)
- Functions: authenticateUser, createEmailTransporter, findUserForPasswordReset, generateOTP, getUserCollection, registerUser, resetUserPassword, sendEmailOTP, sendSMSOTP, storeOTP, verifyOTP, verifyToken

### utils/chord-normalization.js
- Total: 7 (Declared: 7, Class methods: 0)
- Functions: expandKeyFilterVariants, normalizeBaseNote, normalizeChordToken, normalizeKeySignature, normalizeLyricsChords, normalizeManualChords, normalizeSongAccidentals

### utils/rhythm-set.js
- Total: 5 (Declared: 5, Class methods: 0)
- Functions: buildRhythmSetId, normalizeRhythmCategory, normalizeRhythmFamily, normalizeRhythmSetNo, parseRhythmSetId

### validate-admin-functionality.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: validateAdminFunctionality

### validate-song-ids.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: validateSongIds

### verify-database.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: verifyDatabase

### verify-genres-moods.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: verifyGenresMoodsState

### verify-isadmin-boolean.js
- Total: 0 (Declared: 0, Class methods: 0)
- Functions: None detected

### verify-migration.js
- Total: 1 (Declared: 1, Class methods: 0)
- Functions: verifyMigration

