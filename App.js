import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";


const STORAGE_KEY = "gestor_comunicaciones_reuniones_v1";


function crearId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fechaISO(fecha = new Date()) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  const [year, month, day] = fecha.split("-");

  return `${day}/${month}/${year}`;
}

function formatearHora(fecha) {
  return fecha.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function combinarFechaHora(fechaTexto, horaTexto) {
  const [year, month, day] = fechaTexto.split("-").map(Number);
  const [hour, minute] = horaTexto.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, 0);
}

export default function App() {
  const [reuniones, setReuniones] = useState([]);
  const [vista, setVista] = useState("inicio");

  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    fechaISO(new Date())
  );

  const [modalReunion, setModalReunion] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [reunionSeleccionada, setReunionSeleccionada] = useState(null);

  const [persona, setPersona] = useState("");
  const [asunto, setAsunto] = useState("");
  const [fechaReunion, setFechaReunion] = useState(fechaISO(new Date()));
  const [horaReunion, setHoraReunion] = useState(new Date());
  const [mostrarHoraReunion, setMostrarHoraReunion] = useState(false);
  const [resumen, setResumen] = useState("");

  const [compromisoTexto, setCompromisoTexto] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState(new Date());
  const [mostrarFechaCompromiso, setMostrarFechaCompromiso] =
    useState(false);

  useEffect(() => {
    cargarDatos();
    
  }, []);

  useEffect(() => {
    guardarDatos();
  }, [reuniones]);

  async function cargarDatos() {
    try {
      const datos = await AsyncStorage.getItem(STORAGE_KEY);

      if (datos) {
        setReuniones(JSON.parse(datos));
      }
    } catch (error) {
      console.log("Error cargando datos:", error);
    }
  }

  async function guardarDatos() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reuniones));
    } catch (error) {
      console.log("Error guardando datos:", error);
    }
  }

  
  async function programarRecordatorio(compromiso, reunion) {
  // En Expo Go guardamos la fecha y hora del compromiso.
  // La notificación del sistema se habilitará en el APK final.
  return null;
  } 

  function limpiarFormulario() {
    setPersona("");
    setAsunto("");
    setFechaReunion(fechaSeleccionada || fechaISO(new Date()));
    setHoraReunion(new Date());
    setResumen("");
  }

  function abrirNuevaReunion(fecha = fechaSeleccionada) {
    limpiarFormulario();
    setFechaReunion(fecha);
    setModalReunion(true);
  }

  function guardarReunion() {
    if (!persona.trim()) {
      Alert.alert("Dato requerido", "Escribe el nombre de la persona.");
      return;
    }

    if (!asunto.trim()) {
      Alert.alert("Dato requerido", "Escribe el asunto de la reunión.");
      return;
    }

    const nueva = {
      id: crearId(),
      persona: persona.trim(),
      asunto: asunto.trim(),
      fecha: fechaReunion,
      hora: formatearHora(horaReunion),
      resumen: resumen.trim(),
      compromisos: [],
      creada: new Date().toISOString(),
    };

    setReuniones((actuales) => [...actuales, nueva]);
    setModalReunion(false);

    Alert.alert("Reunión guardada", "La reunión fue registrada correctamente.");
  }

  function abrirDetalle(reunion) {
    setReunionSeleccionada(reunion);
    setCompromisoTexto("");
    setFechaCompromiso(new Date());
    setModalDetalle(true);
  }

  function actualizarResumen(texto) {
    if (!reunionSeleccionada) return;

    setReunionSeleccionada({
      ...reunionSeleccionada,
      resumen: texto,
    });
  }

  function guardarResumen() {
    if (!reunionSeleccionada) return;

    const actualizada = reunionSeleccionada;

    setReuniones((actuales) =>
      actuales.map((item) =>
        item.id === actualizada.id ? actualizada : item
      )
    );

    Alert.alert("Resumen actualizado", "Las notas fueron guardadas.");
  }

  async function agregarCompromiso() {
    if (!reunionSeleccionada) return;

    if (!compromisoTexto.trim()) {
      Alert.alert(
        "Dato requerido",
        "Escribe la descripción del compromiso."
      );
      return;
    }

    if (fechaCompromiso <= new Date()) {
      Alert.alert(
        "Fecha no válida",
        "El recordatorio debe programarse para una fecha y hora futura."
      );
      return;
    }

    const compromiso = {
      id: crearId(),
      texto: compromisoTexto.trim(),
      fechaRecordatorio: fechaCompromiso.toISOString(),
      cumplido: false,
      notificationId: null,
    };

    const notificationId = await programarRecordatorio(
      compromiso,
      reunionSeleccionada
    );

    compromiso.notificationId = notificationId;

    const actualizada = {
      ...reunionSeleccionada,
      compromisos: [
        ...(reunionSeleccionada.compromisos || []),
        compromiso,
      ],
    };

    setReunionSeleccionada(actualizada);

    setReuniones((actuales) =>
      actuales.map((item) =>
        item.id === actualizada.id ? actualizada : item
      )
    );

    setCompromisoTexto("");
    setFechaCompromiso(new Date());

    Alert.alert(
      "Compromiso creado",
      "El compromiso fue registrado. La aplicación lo mostrará en el panel de compromisos y alertas."
    );
  }

  async function cambiarEstadoCompromiso(compromiso) {
    if (!reunionSeleccionada) return;

    const nuevoEstado = !compromiso.cumplido;

    
    const compromisosActualizados =
      reunionSeleccionada.compromisos.map((item) =>
        item.id === compromiso.id
          ? { ...item, cumplido: nuevoEstado }
          : item
      );

    const actualizada = {
      ...reunionSeleccionada,
      compromisos: compromisosActualizados,
    };

    setReunionSeleccionada(actualizada);

    setReuniones((actuales) =>
      actuales.map((item) =>
        item.id === actualizada.id ? actualizada : item
      )
    );
  }

  function eliminarReunion(id) {
    Alert.alert(
      "Eliminar reunión",
      "¿Seguro que deseas eliminar esta reunión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setReuniones((actuales) =>
              actuales.filter((item) => item.id !== id)
            );

            setModalDetalle(false);
            setReunionSeleccionada(null);
          },
        },
      ]
    );
  }

  const reunionesSeleccionadas = useMemo(() => {
    return reuniones
      .filter((item) => item.fecha === fechaSeleccionada)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [reuniones, fechaSeleccionada]);

  const compromisos = useMemo(() => {
    const lista = [];

    reuniones.forEach((reunion) => {
      (reunion.compromisos || []).forEach((compromiso) => {
        lista.push({
          ...compromiso,
          reunionId: reunion.id,
          persona: reunion.persona,
          asunto: reunion.asunto,
        });
      });
    });

    return lista.sort(
      (a, b) =>
        new Date(a.fechaRecordatorio) -
        new Date(b.fechaRecordatorio)
    );
  }, [reuniones]);

  const compromisosPendientes = compromisos.filter(
    (item) => !item.cumplido
  );

  const reunionesHoy = reuniones.filter(
    (item) => item.fecha === fechaISO(new Date())
  );

  const marcasCalendario = useMemo(() => {
    const marcas = {};

    reuniones.forEach((reunion) => {
      marcas[reunion.fecha] = {
        marked: true,
        dotColor: "#2563EB",
      };
    });

    marcas[fechaSeleccionada] = {
      ...(marcas[fechaSeleccionada] || {}),
      selected: true,
      selectedColor: "#2563EB",
    };

    return marcas;
  }, [reuniones, fechaSeleccionada]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#172554" />

      <View style={styles.app}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerMini}>AGENDA PROFESIONAL</Text>
            <Text style={styles.headerTitle}>
              Gestor de Comunicaciones
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>GC</Text>
          </View>
        </View>

        {vista === "inicio" && (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.saludo}>Panel de seguimiento</Text>
            <Text style={styles.subtitulo}>
              Reuniones, comunicaciones y compromisos en un solo lugar.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {reunionesHoy.length}
                </Text>
                <Text style={styles.statLabel}>Reuniones hoy</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {compromisosPendientes.length}
                </Text>
                <Text style={styles.statLabel}>
                  Compromisos pendientes
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => abrirNuevaReunion()}
            >
              <Text style={styles.mainButtonPlus}>＋</Text>
              <View>
                <Text style={styles.mainButtonText}>
                  Programar reunión
                </Text>
                <Text style={styles.mainButtonSubtext}>
                  Registrar una nueva comunicación
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Próximas reuniones
              </Text>

              <TouchableOpacity onPress={() => setVista("agenda")}>
                <Text style={styles.verTodas}>Ver agenda</Text>
              </TouchableOpacity>
            </View>

            {reuniones
              .filter((item) => {
                const fecha = combinarFechaHora(
                  item.fecha,
                  item.hora
                );

                return fecha >= new Date();
              })
              .sort(
                (a, b) =>
                  combinarFechaHora(a.fecha, a.hora) -
                  combinarFechaHora(b.fecha, b.hora)
              )
              .slice(0, 4)
              .map((reunion) => (
                <ReunionCard
                  key={reunion.id}
                  reunion={reunion}
                  onPress={() => abrirDetalle(reunion)}
                />
              ))}

            {reuniones.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>
                  No tienes reuniones programadas
                </Text>
                <Text style={styles.emptyText}>
                  Usa el botón superior para registrar tu primera
                  reunión.
                </Text>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Compromisos próximos
              </Text>

              <TouchableOpacity
                onPress={() => setVista("compromisos")}
              >
                <Text style={styles.verTodas}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {compromisosPendientes.slice(0, 4).map((item) => (
              <CompromisoCard
                key={item.id}
                compromiso={item}
              />
            ))}
          </ScrollView>
        )}

        {vista === "agenda" && (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.pageTitle}>Agenda de reuniones</Text>

            <Text style={styles.subtitulo}>
              Selecciona un día para consultar o programar reuniones.
            </Text>

            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={marcasCalendario}
                onDayPress={(day) =>
                  setFechaSeleccionada(day.dateString)
                }
                theme={{
                  todayTextColor: "#2563EB",
                  arrowColor: "#2563EB",
                  selectedDayBackgroundColor: "#2563EB",
                  textDayFontWeight: "500",
                  textMonthFontWeight: "700",
                }}
              />
            </View>

            <View style={styles.agendaTitleRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {formatearFecha(fechaSeleccionada)}
                </Text>
                <Text style={styles.dayCount}>
                  {reunionesSeleccionadas.length} reunión(es)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.smallAddButton}
                onPress={() =>
                  abrirNuevaReunion(fechaSeleccionada)
                }
              >
                <Text style={styles.smallAddButtonText}>
                  + Reunión
                </Text>
              </TouchableOpacity>
            </View>

            {reunionesSeleccionadas.map((reunion) => (
              <ReunionCard
                key={reunion.id}
                reunion={reunion}
                onPress={() => abrirDetalle(reunion)}
              />
            ))}

            {reunionesSeleccionadas.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🗓️</Text>
                <Text style={styles.emptyTitle}>
                  Día disponible
                </Text>
                <Text style={styles.emptyText}>
                  No existen reuniones programadas para esta fecha.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {vista === "compromisos" && (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.pageTitle}>Compromisos</Text>

            <Text style={styles.subtitulo}>
              Seguimiento de las tareas derivadas de tus reuniones.
            </Text>

            <View style={styles.compromiseSummary}>
              <Text style={styles.compromiseSummaryNumber}>
                {compromisosPendientes.length}
              </Text>

              <Text style={styles.compromiseSummaryText}>
                pendientes por gestionar
              </Text>
            </View>

            {compromisos.map((item) => (
              <CompromisoCard
                key={item.id}
                compromiso={item}
              />
            ))}

            {compromisos.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyTitle}>
                  No existen compromisos
                </Text>
                <Text style={styles.emptyText}>
                  Los compromisos se crean desde el detalle de cada
                  reunión.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.bottomNav}>
          <NavButton
            icon="⌂"
            label="Inicio"
            activo={vista === "inicio"}
            onPress={() => setVista("inicio")}
          />

          <NavButton
            icon="▦"
            label="Agenda"
            activo={vista === "agenda"}
            onPress={() => setVista("agenda")}
          />

          <NavButton
            icon="✓"
            label="Compromisos"
            activo={vista === "compromisos"}
            onPress={() => setVista("compromisos")}
          />
        </View>

        <Modal
          visible={modalReunion}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalReunion(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalSafe}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    Nueva reunión
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Programa una comunicación
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalReunion(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <FormLabel texto="Nombre de la persona" requerido />

              <TextInput
                style={styles.input}
                value={persona}
                onChangeText={setPersona}
                placeholder="Ej. Ana Gómez"
              />

              <FormLabel texto="Asunto" requerido />

              <TextInput
                style={styles.input}
                value={asunto}
                onChangeText={setAsunto}
                placeholder="Ej. Seguimiento al proyecto"
              />

              <FormLabel texto="Fecha" />

              <View style={styles.selectedDate}>
                <Text style={styles.selectedDateText}>
                  {formatearFecha(fechaReunion)}
                </Text>
              </View>

              <Calendar
                current={fechaReunion}
                markedDates={{
                  [fechaReunion]: {
                    selected: true,
                    selectedColor: "#2563EB",
                  },
                }}
                onDayPress={(day) =>
                  setFechaReunion(day.dateString)
                }
              />

              <FormLabel texto="Hora" />

              <TouchableOpacity
                style={styles.input}
                onPress={() => setMostrarHoraReunion(true)}
              >
                <Text style={styles.datePickerText}>
                  {formatearHora(horaReunion)}
                </Text>
              </TouchableOpacity>

              {mostrarHoraReunion && (
                <DateTimePicker
                  value={horaReunion}
                  mode="time"
                  is24Hour
                  onChange={(event, selectedDate) => {
                    setMostrarHoraReunion(false);

                    if (selectedDate) {
                      setHoraReunion(selectedDate);
                    }
                  }}
                />
              )}

              <FormLabel texto="Notas o resumen" />

              <TextInput
                style={[styles.input, styles.textArea]}
                value={resumen}
                onChangeText={setResumen}
                multiline
                placeholder="Puedes escribir aquí observaciones previas o dejar este campo para completarlo después de la reunión."
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={guardarReunion}
              >
                <Text style={styles.saveButtonText}>
                  Guardar reunión
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={modalDetalle}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalDetalle(false)}
        >
          {reunionSeleccionada && (
            <KeyboardAvoidingView
              style={styles.modalSafe}
              behavior={
                Platform.OS === "ios" ? "padding" : undefined
              }
            >
              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>
                      {reunionSeleccionada.persona}
                    </Text>

                    <Text style={styles.modalSubtitle}>
                      {reunionSeleccionada.asunto}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalDetalle(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailInfo}>
                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>FECHA</Text>
                    <Text style={styles.detailInfoValue}>
                      {formatearFecha(
                        reunionSeleccionada.fecha
                      )}
                    </Text>
                  </View>

                  <View style={styles.detailInfoItem}>
                    <Text style={styles.detailInfoLabel}>HORA</Text>
                    <Text style={styles.detailInfoValue}>
                      {reunionSeleccionada.hora}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailSectionTitle}>
                  Resumen de la reunión
                </Text>

                <TextInput
                  style={[styles.input, styles.largeTextArea]}
                  multiline
                  value={reunionSeleccionada.resumen}
                  onChangeText={actualizarResumen}
                  placeholder="Registra las decisiones, observaciones y conclusiones de la reunión..."
                />

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={guardarResumen}
                >
                  <Text style={styles.secondaryButtonText}>
                    Guardar resumen
                  </Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                <Text style={styles.detailSectionTitle}>
                  Compromisos
                </Text>

                {(reunionSeleccionada.compromisos || []).map(
                  (compromiso) => (
                    <TouchableOpacity
                      key={compromiso.id}
                      style={[
                        styles.commitmentDetail,
                        compromiso.cumplido &&
                          styles.commitmentCompleted,
                      ]}
                      onPress={() =>
                        cambiarEstadoCompromiso(compromiso)
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          compromiso.cumplido &&
                            styles.checkboxDone,
                        ]}
                      >
                        <Text style={styles.checkboxText}>
                          {compromiso.cumplido ? "✓" : ""}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.commitmentText,
                            compromiso.cumplido &&
                              styles.strikeText,
                          ]}
                        >
                          {compromiso.texto}
                        </Text>

                        <Text style={styles.commitmentDate}>
                          Recordatorio:{" "}
                          {new Date(
                            compromiso.fechaRecordatorio
                          ).toLocaleString("es-CO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                )}

                <View style={styles.newCommitmentBox}>
                  <Text style={styles.newCommitmentTitle}>
                    Nuevo compromiso
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={compromisoTexto}
                    onChangeText={setCompromisoTexto}
                    placeholder="Ej. Enviar informe de avance"
                  />

                  <TouchableOpacity
                    style={styles.input}
                    onPress={() =>
                      setMostrarFechaCompromiso(true)
                    }
                  >
                    <Text style={styles.datePickerText}>
                      Recordatorio:{" "}
                      {fechaCompromiso.toLocaleString("es-CO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Text>
                  </TouchableOpacity>

                  {mostrarFechaCompromiso && (
                    <DateTimePicker
                      value={fechaCompromiso}
                      mode="datetime"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setMostrarFechaCompromiso(false);

                        if (selectedDate) {
                          setFechaCompromiso(selectedDate);
                        }
                      }}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.addCommitmentButton}
                    onPress={agregarCompromiso}
                  >
                    <Text style={styles.addCommitmentText}>
                      + Agregar compromiso y recordatorio
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    eliminarReunion(reunionSeleccionada.id)
                  }
                >
                  <Text style={styles.deleteButtonText}>
                    Eliminar reunión
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function FormLabel({ texto, requerido }) {
  return (
    <Text style={styles.label}>
      {texto}
      {requerido && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function ReunionCard({ reunion, onPress }) {
  const pendientes = (reunion.compromisos || []).filter(
    (item) => !item.cumplido
  ).length;

  return (
    <TouchableOpacity
      style={styles.meetingCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{reunion.hora}</Text>

        <Text style={styles.dateMini}>
          {formatearFecha(reunion.fecha)}
        </Text>
      </View>

      <View style={styles.meetingBody}>
        <Text style={styles.meetingPerson}>{reunion.persona}</Text>

        <Text
          style={styles.meetingSubject}
          numberOfLines={2}
        >
          {reunion.asunto}
        </Text>

        {pendientes > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>
              {pendientes} compromiso(s)
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function CompromisoCard({ compromiso }) {
  const fecha = new Date(compromiso.fechaRecordatorio);

  const vencido =
    !compromiso.cumplido && fecha.getTime() < Date.now();

  return (
    <View
      style={[
        styles.commitmentCard,
        vencido && styles.commitmentOverdue,
        compromiso.cumplido &&
          styles.commitmentCompleted,
      ]}
    >
      <View
        style={[
          styles.commitmentIndicator,
          vencido && styles.indicatorOverdue,
          compromiso.cumplido &&
            styles.indicatorCompleted,
        ]}
      />

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.commitmentText,
            compromiso.cumplido && styles.strikeText,
          ]}
        >
          {compromiso.texto}
        </Text>

        <Text style={styles.commitmentPerson}>
          {compromiso.persona}
        </Text>

        <Text
          style={[
            styles.commitmentDate,
            vencido && styles.overdueText,
          ]}
        >
          {vencido ? "Vencido · " : ""}
          {fecha.toLocaleString("es-CO", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Text>
      </View>
    </View>
  );
}

function NavButton({ icon, label, activo, onPress }) {
  return (
    <TouchableOpacity
      style={styles.navButton}
      onPress={onPress}
    >
      <Text
        style={[
          styles.navIcon,
          activo && styles.navActive,
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.navLabel,
          activo && styles.navActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#172554",
  },

  app: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  header: {
    backgroundColor: "#172554",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerMini: {
    color: "#93C5FD",
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "700",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 3,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

  saludo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172033",
  },

  subtitulo: {
    color: "#758096",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 20,
  },

  pageTitle: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5EAF1",
  },

  statNumber: {
    fontSize: 27,
    color: "#2563EB",
    fontWeight: "900",
  },

  statLabel: {
    fontSize: 11,
    color: "#667085",
    marginTop: 3,
  },

  mainButton: {
    backgroundColor: "#2563EB",
    padding: 17,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 25,
  },

  mainButtonPlus: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
  },

  mainButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  mainButtonSubtext: {
    color: "#BFDBFE",
    fontSize: 11,
    marginTop: 2,
  },

  sectionHeader: {
    marginTop: 5,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#263248",
    fontSize: 16,
    fontWeight: "800",
  },

  verTodas: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
  },

  meetingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E4E9F1",
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  timeBox: {
    width: 72,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    marginRight: 13,
  },

  timeText: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 15,
  },

  dateMini: {
    color: "#8A94A6",
    fontSize: 9,
    marginTop: 3,
  },

  meetingBody: {
    flex: 1,
  },

  meetingPerson: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "800",
  },

  meetingSubject: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 3,
  },

  pendingBadge: {
    backgroundColor: "#FFF7ED",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 8,
  },

  pendingBadgeText: {
    color: "#C76816",
    fontSize: 9,
    fontWeight: "700",
  },

  chevron: {
    color: "#B4BBC8",
    fontSize: 28,
  },

  empty: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 27,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EAF0",
    marginBottom: 18,
  },

  emptyIcon: {
    fontSize: 30,
  },

  emptyTitle: {
    marginTop: 8,
    color: "#344054",
    fontSize: 14,
    fontWeight: "800",
  },

  emptyText: {
    color: "#8993A4",
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 17,
  },

  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E4E9F1",
  },

  agendaTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  dayCount: {
    color: "#8A94A5",
    fontSize: 10,
    marginTop: 2,
  },

  smallAddButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
  },

  smallAddButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
  },

  compromiseSummary: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#172554",
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  compromiseSummaryNumber: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginRight: 12,
  },

  compromiseSummaryText: {
    color: "#BFDBFE",
    fontSize: 12,
  },

  commitmentCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E9F0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    gap: 10,
  },

  commitmentOverdue: {
    backgroundColor: "#FFF7F7",
  },

  commitmentCompleted: {
    opacity: 0.65,
  },

  commitmentIndicator: {
    width: 5,
    borderRadius: 99,
    backgroundColor: "#F59E0B",
  },

  indicatorOverdue: {
    backgroundColor: "#DC2626",
  },

  indicatorCompleted: {
    backgroundColor: "#16A34A",
  },

  commitmentText: {
    color: "#263248",
    fontSize: 13,
    fontWeight: "700",
  },

  commitmentPerson: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 3,
  },

  commitmentDate: {
    color: "#8A94A5",
    fontSize: 9,
    marginTop: 5,
  },

  overdueText: {
    color: "#DC2626",
    fontWeight: "700",
  },

  strikeText: {
    textDecorationLine: "line-through",
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E3E8EF",
    flexDirection: "row",
    paddingBottom: Platform.OS === "ios" ? 10 : 0,
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    color: "#98A1B2",
    fontSize: 20,
    fontWeight: "700",
  },

  navLabel: {
    color: "#98A1B2",
    fontSize: 9,
    marginTop: 3,
    fontWeight: "600",
  },

  navActive: {
    color: "#2563EB",
  },

  modalSafe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  modalContent: {
    padding: 20,
    paddingBottom: 50,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  modalTitle: {
    color: "#172033",
    fontSize: 23,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: "#828DA0",
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E9EDF3",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#526075",
    fontWeight: "900",
  },

  label: {
    color: "#455167",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 7,
    marginTop: 13,
  },

  required: {
    color: "#DC2626",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBE1E9",
    borderRadius: 11,
    minHeight: 49,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#273449",
    fontSize: 13,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  largeTextArea: {
    minHeight: 140,
    textAlignVertical: "top",
  },

  selectedDate: {
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 9,
    marginBottom: 7,
  },

  selectedDateText: {
    color: "#2563EB",
    fontWeight: "800",
    textAlign: "center",
  },

  datePickerText: {
    color: "#344054",
    fontSize: 13,
  },

  saveButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 25,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  secondaryButton: {
    backgroundColor: "#EAF1FF",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "800",
    fontSize: 12,
  },

  detailInfo: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E4E9F1",
  },

  detailInfoItem: {
    flex: 1,
  },

  detailInfoLabel: {
    color: "#98A2B3",
    fontSize: 9,
    fontWeight: "700",
  },

  detailInfoValue: {
    color: "#273449",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },

  detailSectionTitle: {
    color: "#29364C",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },

  separator: {
    height: 1,
    backgroundColor: "#E2E7EE",
    marginVertical: 25,
  },

  commitmentDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E7EE",
    borderRadius: 11,
    padding: 12,
    marginBottom: 8,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#CBD3DF",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxDone: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },

  checkboxText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  newCommitmentBox: {
    backgroundColor: "#EEF4FF",
    borderRadius: 14,
    padding: 14,
    marginTop: 15,
  },

  newCommitmentTitle: {
    color: "#315B9D",
    fontWeight: "800",
    marginBottom: 5,
  },

  addCommitmentButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },

  addCommitmentText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
  },

  deleteButton: {
    marginTop: 30,
    alignItems: "center",
    padding: 13,
  },

  deleteButtonText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },
});