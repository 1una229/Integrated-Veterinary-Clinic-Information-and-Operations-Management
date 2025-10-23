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

        // NEW: contact number (11 digits preferred; UI enforces this)
        public String contactNumber;   // "09xxxxxxxxx"

        public String species;
        public String breed;
        public String gender;
        public Integer age;

        // Microchip: UI enforces numeric-only; backend stores as string
        public String microchip;

        public String owner;
        public String address;
        public String federation;

        public String photo;           // URL (/uploads/...) or dataURL in local mode
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
        public String completedAt;    // YYYY-MM-DD
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
        public String date;           // YYYY-MM-DD
        public boolean dispensed;
        public String dispensedAt;    // YYYY-MM-DD
    }

    // --- User ---
    public static class User {
        public Long id;
        @NotBlank public String name;
        @NotBlank public String role; // admin, vet, receptionist, pharmacist
    }

    // (If you already added OperationLog/ReportSummary before, keep them too.)
}
