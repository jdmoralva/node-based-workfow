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

export function ConnectionBuilder({ connectionId, onConnectionDropped, onConnectionSaved }: ConnectionBuilderProps) {
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [databasePath, setDatabasePath] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [loadingConnection, setLoadingConnection] = useState(Boolean(connectionId));
  const [loadingDatabases, setLoadingDatabases] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const existingMode = Boolean(connectionId);

  useEffect(() => {
    let active = true;
    setLoadingDatabases(true);
    listDatabaseOptions()
      .then((response) => {
        if (!active) {
          return;
        }
        setDatabases(response.databases);
        setDatabasePath(response.databases[0]?.value ?? "");
      })
      .catch(() => {
        if (active) {
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
  }, []);

  useEffect(() => {
    let active = true;
    setFeedback(null);

    if (!connectionId) {
      setLabel("");
      setLoadingConnection(false);
      return () => {
        active = false;
      };
    }

    setLoadingConnection(true);
    readConnection(connectionId)
      .then((connection) => {
        if (!active) {
          return;
        }
        setLabel(connection.label);
        setDatabasePath(connection.database_path);
      })
      .catch(() => {
        if (active) {
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
    setSubmitting(true);
    setFeedback(null);
    try {
      if (connectionId) {
        const result = await testSavedConnection(connectionId);
        onConnectionSaved(result.connection);
        setFeedback(result.message);
      } else {
        const result = await testUnsavedConnection({ driver: "sqlite", database_path: databasePath });
        setFeedback(result.message);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave() {
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const connection = connectionId
        ? await updateConnection(connectionId, { driver: "sqlite", database_path: databasePath })
        : await createConnection({ label: label.trim(), driver: "sqlite", database_path: databasePath });
      onConnectionSaved(connection);
      setFeedback("Connection saved.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Connection could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDrop() {
    if (!connectionId) {
      return;
    }
    if (!window.confirm("Drop this connection? The source database file will not be deleted.")) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await deleteConnection(connectionId);
      setFeedback("Connection dropped.");
      onConnectionDropped?.(connectionId);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Connection could not be dropped.");
    } finally {
      setSubmitting(false);
    }
  }

  const unavailable = loadingConnection || loadingDatabases || databases.length === 0 || submitting;

  return (
    <div className="rv-connection-builder" data-testid="connection-builder">
      <div className="rv-connection-builder__header">
        <p className="rv-connection-builder__eyebrow">Connections</p>
        <h2>{existingMode && label ? label : "New database connection"}</h2>
      </div>

      <div className="rv-connection-builder__grid">
        <label className="rv-connection-builder__field">
          <span>Connection label</span>
          <input readOnly={existingMode} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>

        <label className="rv-connection-builder__field">
          <span>Database type</span>
          <input readOnly value="SQLite" />
        </label>

        <label className="rv-connection-builder__field rv-connection-builder__field--wide">
          <span>Database</span>
          <select disabled={loadingDatabases || databases.length === 0} value={databasePath} onChange={(event) => setDatabasePath(event.target.value)}>
            {databases.map((database) => (
              <option key={database.value} value={database.value}>
                {database.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loadingDatabases ? <p className="rv-connection-builder__note">Loading available databases...</p> : null}
      {loadingConnection ? <p className="rv-connection-builder__note">Loading saved connection...</p> : null}
      {!loadingDatabases && databases.length === 0 ? (
        <p className="rv-connection-builder__note">No SQLite databases were found under the configured datasets folder.</p>
      ) : null}
      {feedback ? <p className="rv-connection-builder__feedback">{feedback}</p> : null}

      <div className="rv-connection-builder__actions">
        <button disabled={unavailable} onClick={handleTest} type="button">
          Test
        </button>
        <button disabled={unavailable} onClick={handleSave} type="button">
          Save Connection
        </button>
        {existingMode ? (
          <button disabled={unavailable} onClick={handleDrop} type="button">
            Drop
          </button>
        ) : null}
      </div>
    </div>
  );
}
