package com.pawcare.model;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class Models {

    // --- Pet & Procedure ---
    public static class Procedure {
        public String date;
        public String procedure;
        public String notes;
        public String vet;
    }

    public static class Pet {
        public Long id;
        @NotBlank public String name;
        public String species;
        public String breed;
        public String gender;
        public Integer age;
        public String microchip;
        public String owner;
        public String address;
        public String federation;
        public String photo;           // /uploads/...
        public List<Procedure> procedures = new ArrayList<>();
    }

    // --- Appointment ---
    public static class Appointment {
        public Long id;
        public Long petId;
        public String owner;
        public String date;           // YYYY-MM-DD
        public String time;           // HH:mm
        public String vet;
        public String status;         // Pending / Approved by Vet / Done
        public String completedAt;    // YYYY-MM-DD (when marked Done)
    }

    // --- Prescription ---
    public static class Prescription {
        public Long id;
        public Long petId;
        public String pet;
        public String owner;
        public String drug;
        public String dosage;
        public String directions;
        public String prescriber;
        public String date;           // YYYY-MM-DD (issued)
        public boolean dispensed;
        public String dispensedAt;    // YYYY-MM-DD (when marked dispensed)
    }

    // --- User ---
    public static class User {
        public Long id;
        @NotBlank public String name;
        @NotBlank public String role; // admin, vet, receptionist, pharmacist
    }

    // --- Operation Log (for summaries/history) ---
    public static class OperationLog {
        public Long id;
        public String ts;         // ISO-like YYYY-MM-DDTHH:mm:ss
        public String type;       // PET_CREATED, APPT_CREATED, APPT_APPROVED, APPT_DONE, RX_CREATED, RX_DISPENSED
        public String message;    // human-readable
        public Long petId;        // optional
    }

    // --- Report summary DTO ---
    public static class ReportSummary {
        public String period;          // day|week|month|custom
        public String from;            // YYYY-MM-DD
        public String to;              // YYYY-MM-DD
        public int appointmentsDone;
        public int prescriptionsDispensed;
        public int petsAdded;
        public List<OperationLog> events = new ArrayList<>();
    }
}
