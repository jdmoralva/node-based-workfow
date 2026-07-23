"use client";

import { useEffect, useState } from "react";

import type { DatabaseOption, SavedConnection } from "@/features/creditmodeler/connection-types";
import {
  createConnection,
  deleteConnection,
  listDatabaseOptions,
  readConnection,
  testSavedConnection,
  testUnsavedConnection,
  updateConnection
} from "@/features/creditmodeler/connections-client";

type ConnectionBuilderProps = {
  connectionId?: string;
  onConnectionDropped?: (connectionId: string) => void;
  onConnectionSaved: (connection: SavedConnection) => void;
};

type ConnectionAction = "drop" | "save" | "test" | null;

type LocalTestResult = {
  databasePath: string;
  status: "failed" | "passed";
  testedAt: string | null;
};

function unavailableDatabaseLabel(databasePath: string): string {
  return databasePath.replace(/\.(db|sqlite|sqlite3)$/i, "");
}

function formatTestDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(value));
}

export function ConnectionBuilder({ connectionId, onConnectionDropped, onConnectionSaved }: ConnectionBuilderProps) {
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [databaseOptionsError, setDatabaseOptionsError] = useState(false);
  const [databasePath, setDatabasePath] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastSuccessfulTestAt, setLastSuccessfulTestAt] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [localTestResult, setLocalTestResult] = useState<LocalTestResult | null>(null);
  const [connectionLoadError, setConnectionLoadError] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(Boolean(connectionId));
  const [loadingDatabases, setLoadingDatabases] = useState(true);
  const [savedDatabasePath, setSavedDatabasePath] = useState("");
  const [savedTestedDatabasePath, setSavedTestedDatabasePath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<ConnectionAction>(null);
  const existingMode = Boolean(connectionId);

  useEffect(() => {
    let active = true;
    setDatabaseOptionsError(false);
    setLoadingDatabases(true);
    listDatabaseOptions()
      .then((response) => {
        if (!active) {
          return;
        }
        setDatabases(response.databases);
        if (!connectionId) {
          setDatabasePath(response.databases[0]?.value ?? "");
        }
      })
      .catch(() => {
        if (active) {
          setDatabaseOptionsError(true);
          setFeedback("Database options could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingDatabases(false);
        }
      });

    return () => {
      active = false;
    };
  }, [connectionId]);

  useEffect(() => {
    let active = true;
    setFeedback(null);
    setConnectionLoadError(false);
    setLastSuccessfulTestAt(null);
    setLocalTestResult(null);
    setSavedDatabasePath("");
    setSavedTestedDatabasePath(null);

    if (!connectionId) {
      setLabel("");
      setLoadingConnection(false);
      return () => {
        active = false;
      };
    }

    setDatabasePath("");
    setLoadingConnection(true);
    readConnection(connectionId)
      .then((connection) => {
        if (!active) {
          return;
        }
        setLabel(connection.label);
        setDatabasePath(connection.database_path);
        setLastSuccessfulTestAt(connection.last_tested_at);
        setSavedDatabasePath(connection.database_path);
        setSavedTestedDatabasePath(connection.last_tested_at ? connection.database_path : null);
      })
      .catch(() => {
        if (active) {
          setConnectionLoadError(true);
          setFeedback("Connection could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoadingConnection(false);
        }
      });

    return () => {
      active = false;
    };
  }, [connectionId]);

  function validate(): boolean {
    if (!existingMode && !label.trim()) {
      setFeedback("Enter a connection label before testing or saving.");
      return false;
    }
    if (!databasePath) {
      setFeedback("Select a database before testing or saving.");
      return false;
    }
    return true;
  }

  async function handleTest() {
    if (!validate()) {
      return;
    }
    const testedDatabasePath = databasePath;
    setSubmitting("test");
    setFeedback(null);
    try {
      if (connectionId && testedDatabasePath === savedDatabasePath) {
        const result = await testSavedConnection(connectionId);
        onConnectionSaved(result.connection);
        setLastSuccessfulTestAt(result.connection.last_tested_at);
        setSavedDatabasePath(result.connection.database_path);
        setSavedTestedDatabasePath(result.connection.last_tested_at ? result.connection.database_path : null);
        setLocalTestResult({ databasePath: testedDatabasePath, status: "passed", testedAt: result.connection.last_tested_at });
        setFeedback(result.message);
      } else {
        const result = await testUnsavedConnection({ driver: "sqlite", database_path: testedDatabasePath });
        setLocalTestResult({ databasePath: testedDatabasePath, status: "passed", testedAt: null });
        setFeedback(result.message);
      }
    } catch (error) {
      setLocalTestResult({ databasePath: testedDatabasePath, status: "failed", testedAt: null });
      setFeedback(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }
    setSubmitting("save");
    setFeedback(null);
    try {
      const connection = connectionId
        ? await updateConnection(connectionId, { driver: "sqlite", database_path: databasePath })
        : await createConnection({ label: label.trim(), driver: "sqlite", database_path: databasePath });
      if (connectionId) {
        const databaseChanged = savedDatabasePath !== connection.database_path;
        setSavedDatabasePath(connection.database_path);
        setLastSuccessfulTestAt(connection.last_tested_at);
        if (!databaseChanged) {
          setSavedTestedDatabasePath(connection.last_tested_at ? connection.database_path : null);
        }
      }
      onConnectionSaved(connection);
      setFeedback("Connection saved.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Connection could not be saved.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDrop() {
    if (!connectionId) {
      return;
    }
    if (!window.confirm("Drop this connection? The source database file will not be deleted.")) {
      return;
    }
    setSubmitting("drop");
    setFeedback(null);
    try {
      await deleteConnection(connectionId);
      setFeedback("Connection dropped.");
      onConnectionDropped?.(connectionId);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Connection could not be dropped.");
    } finally {
      setSubmitting(null);
    }
  }

  const loading = loadingConnection || loadingDatabases;
  const labelReady = Boolean(label.trim());
  const databaseReady = databases.some((database) => database.value === databasePath);
  const savedDatabaseUnavailable = existingMode
    && !loading
    && !databaseOptionsError
    && databases.length > 0
    && Boolean(databasePath)
    && !databaseReady;
  const unavailable = databaseOptionsError || connectionLoadError || savedDatabaseUnavailable;
  const selectedTestResult = localTestResult?.databasePath === databasePath ? localTestResult : null;
  const loadedSavedTestPassed = !selectedTestResult
    && savedTestedDatabasePath === databasePath
    && Boolean(lastSuccessfulTestAt);
  const testPassed = selectedTestResult?.status === "passed" || loadedSavedTestPassed;
  const testFailed = selectedTestResult?.status === "failed";
  const readinessCount = Number(labelReady) + Number(databaseReady) + Number(testPassed);
  const status = unavailable
    ? "Unavailable"
    : loading
      ? "Loading"
      : submitting === "test"
        ? "Testing"
        : testFailed
          ? "Failed"
          : testPassed
            ? "Tested"
            : "Untested";
  const sectionState = databaseOptionsError || connectionLoadError
    ? "Unavailable"
    : loading
      ? "Loading"
      : databases.length === 0
        ? "No databases"
        : savedDatabaseUnavailable
          ? "Database unavailable"
          : !labelReady
            ? "Label required"
            : !databaseReady
              ? "Database required"
              : "Complete";
  const databaseHealth = databaseOptionsError || savedDatabaseUnavailable
    ? "Unavailable"
    : databases.length === 0
      ? "No databases"
      : databaseReady
        ? "Selected"
        : "Not selected";
  const lastTestHealth = testPassed
    ? selectedTestResult?.testedAt
      ? formatTestDate(selectedTestResult.testedAt)
      : selectedTestResult
        ? "Passed this session"
        : lastSuccessfulTestAt
          ? formatTestDate(lastSuccessfulTestAt)
          : "Passed this session"
    : lastSuccessfulTestAt
      ? `${formatTestDate(lastSuccessfulTestAt)} · historical`
      : "Not tested";
  const actionNote = loading || unavailable || submitting
    ? null
    : !labelReady
      ? "Add a label to continue"
      : !databaseReady
        ? "Select a database to continue"
        : testFailed
          ? "Review test feedback"
          : existingMode && databasePath !== savedDatabasePath
            ? "Database selection changed"
            : selectedTestResult?.status === "passed"
              ? "Connection test passed"
              : existingMode
                ? "Saved connection"
                : "Ready to test or save";
  const testSaveDisabled = loading
    || submitting !== null
    || databaseOptionsError
    || connectionLoadError
    || databases.length === 0
    || !databaseReady;
  const dropDisabled = loading || submitting !== null || connectionLoadError;
  const unavailableOption = existingMode && databasePath && !databaseReady ? databasePath : null;

  return (
    <div className="rv-connection-builder" data-testid="connection-builder">
      <header className="rv-connection-builder__header">
        <div>
          <p className="rv-connection-builder__eyebrow">SQLite connection</p>
          <div className="rv-connection-builder__title-row">
            <h2>
              {existingMode
                ? connectionLoadError
                  ? "Saved connection unavailable"
                  : label || "Loading saved connection..."
                : "New database connection"}
            </h2>
            {existingMode && !connectionLoadError && !loadingConnection ? <span className="rv-connection-builder__locked">Name locked</span> : null}
          </div>
          <p>Register a trusted SQLite source, verify access, and make it available to data models.</p>
        </div>
        <div className="rv-connection-builder__status-block">
          <span className="rv-connection-builder__status" data-status={status.toLowerCase()}>{status}</span>
          <small>{existingMode ? "Saved connection" : "Unsaved connection"}</small>
        </div>
      </header>

      <div aria-label="Connection health" className="rv-connection-builder__health" role="region">
        <div><span>Driver</span><strong>SQLite</strong></div>
        <div><span>Database</span><strong data-tone={databaseReady ? "complete" : databaseHealth === "Unavailable" ? "failed" : "warning"}>{databaseHealth}</strong></div>
        <div><span>Last successful test</span><strong data-tone={testPassed ? "complete" : testFailed ? "failed" : "warning"}>{lastTestHealth}</strong></div>
      </div>

      <div className="rv-connection-builder__layout">
        <section aria-label="Connection setup" className="rv-connection-builder__section">
          <div className="rv-connection-builder__section-header">
            <span className="rv-connection-builder__section-number">01</span>
            <span className="rv-connection-builder__section-heading">
              <strong>Connection details</strong>
              <small>Identity and database source</small>
            </span>
            <span className="rv-connection-builder__section-state" data-tone={sectionState === "Complete" ? "complete" : "warning"}>{sectionState}</span>
            <span aria-hidden="true" className="rv-connection-builder__section-chevron">▾</span>
          </div>
          <div className="rv-connection-builder__grid">
            <label className="rv-connection-builder__field">
              <span>Connection label</span>
              <input
                aria-label="Connection label"
                readOnly={existingMode}
                value={label}
                onChange={(event) => {
                  setLabel(event.target.value);
                  setFeedback(null);
                }}
              />
              {existingMode && !connectionLoadError ? <small>Labels are immutable after the first save.</small> : null}
            </label>

            <label className="rv-connection-builder__field">
              <span>Database type</span>
              <input readOnly value="SQLite" />
            </label>

            <label className="rv-connection-builder__field rv-connection-builder__field--wide">
              <span>Database</span>
              <select
                disabled={loadingDatabases || databaseOptionsError || databases.length === 0 || connectionLoadError}
                value={databasePath}
                onChange={(event) => {
                  setDatabasePath(event.target.value);
                  setFeedback(null);
                }}
              >
                {!databasePath ? <option value="">Select a discovered SQLite database</option> : null}
                {unavailableOption ? (
                  <option value={unavailableOption}>{unavailableDatabaseLabel(unavailableOption)} · unavailable</option>
                ) : null}
                {databases.map((database) => (
                  <option key={database.value} value={database.value}>
                    {database.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <aside aria-label="Connection readiness" className="rv-connection-builder__readiness" role="region">
          <div className="rv-connection-builder__readiness-header">
            <strong>Readiness</strong>
            <span>{readinessCount} of 3</span>
          </div>
          <div className="rv-connection-builder__readiness-list">
            <p data-state={labelReady ? "complete" : "warning"}><span />{labelReady ? existingMode ? "Connection label saved." : "Connection label added." : "Add a connection label."}</p>
            <p data-state={databaseReady ? "complete" : "warning"}>
              <span />
              {databaseReady
                ? "SQLite database selected."
                : databaseOptionsError
                  ? "Database options are unavailable."
                  : savedDatabaseUnavailable
                    ? "Saved database is unavailable. Select a replacement."
                    : databases.length === 0 && !loadingDatabases
                      ? "No discovered SQLite databases are available."
                      : "Select a discovered SQLite database."}
            </p>
            <p data-state={testPassed ? "complete" : "warning"}><span />{testPassed ? "Connection test passed." : testFailed ? "Latest connection test failed." : "Run a connection test."}</p>
          </div>
          <p className="rv-connection-builder__test-note"><strong>Connection-only test.</strong> Testing verifies that SQLite can be opened and queried. It does not inspect tables or columns.</p>
        </aside>
      </div>

      <div aria-live="polite" className="rv-connection-builder__feedback-region">
        {loadingDatabases ? <p className="rv-connection-builder__note">Loading available databases...</p> : null}
        {loadingConnection ? <p className="rv-connection-builder__note">Loading saved connection...</p> : null}
        {!loadingDatabases && !databaseOptionsError && databases.length === 0 ? (
          <div className="rv-connection-builder__note">
            <p>No SQLite databases were found under the configured datasets folder.</p>
            <p>Supported file types are .db, .sqlite, and .sqlite3.</p>
          </div>
        ) : null}
        {feedback ? <p className="rv-connection-builder__feedback">{feedback}</p> : null}
      </div>

      <footer className="rv-connection-builder__actions">
        <div>
          {existingMode ? (
            <button className="rv-connection-builder__danger-button" disabled={dropDisabled} onClick={handleDrop} type="button">
              {submitting === "drop" ? "Dropping..." : "Drop"}
            </button>
          ) : null}
        </div>
        <div className="rv-connection-builder__action-group">
          {actionNote ? <span className="rv-connection-builder__action-note">{actionNote}</span> : null}
          <button className="rv-connection-builder__test-button" disabled={testSaveDisabled} onClick={handleTest} type="button">
            {submitting === "test" ? "Testing..." : "Test connection"}
          </button>
          <button className="rv-connection-builder__primary-button" disabled={testSaveDisabled} onClick={handleSave} type="button">
            {submitting === "save" ? "Saving..." : "Save Connection"}
          </button>
        </div>
      </footer>
    </div>
  );
}
