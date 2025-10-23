package com.pawcare.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "prescriptions")
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pet_id")
    private Long petId;

    private String pet;
    private String owner;
    private String drug;
    private String dosage;
    private String directions;
    private String prescriber;
    private LocalDate date;
    private boolean dispensed;

    @Column(name = "dispensed_at")
    private LocalDate dispensedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", insertable = false, updatable = false)
    private Pet petEntity;

    // Constructors
    public Prescription() {}

    public Prescription(Long petId, String pet, String owner, String drug, String dosage, 
                       String directions, String prescriber, LocalDate date) {
        this.petId = petId;
        this.pet = pet;
        this.owner = owner;
        this.drug = drug;
        this.dosage = dosage;
        this.directions = directions;
        this.prescriber = prescriber;
        this.date = date;
        this.dispensed = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPetId() { return petId; }
    public void setPetId(Long petId) { this.petId = petId; }

    public String getPet() { return pet; }
    public void setPet(String pet) { this.pet = pet; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public String getDrug() { return drug; }
    public void setDrug(String drug) { this.drug = drug; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getDirections() { return directions; }
    public void setDirections(String directions) { this.directions = directions; }

    public String getPrescriber() { return prescriber; }
    public void setPrescriber(String prescriber) { this.prescriber = prescriber; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public boolean isDispensed() { return dispensed; }
    public void setDispensed(boolean dispensed) { this.dispensed = dispensed; }

    public LocalDate getDispensedAt() { return dispensedAt; }
    public void setDispensedAt(LocalDate dispensedAt) { this.dispensedAt = dispensedAt; }

    public Pet getPetEntity() { return petEntity; }
    public void setPetEntity(Pet petEntity) { this.petEntity = petEntity; }
}

