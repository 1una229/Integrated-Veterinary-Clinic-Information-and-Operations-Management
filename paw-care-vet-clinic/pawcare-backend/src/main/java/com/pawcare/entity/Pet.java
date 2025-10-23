package com.pawcare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pets")
public class Pet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String species;
    private String breed;
    private String gender;
    private Integer age;
    private String microchip;
    private String owner;
    private String address;
    private String federation;
    private String photo;

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Procedure> procedures = new ArrayList<>();

    // Constructors
    public Pet() {}

    public Pet(String name, String species, String breed, String gender, Integer age, 
              String microchip, String owner, String address, String federation) {
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.gender = gender;
        this.age = age;
        this.microchip = microchip;
        this.owner = owner;
        this.address = address;
        this.federation = federation;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getMicrochip() { return microchip; }
    public void setMicrochip(String microchip) { this.microchip = microchip; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getFederation() { return federation; }
    public void setFederation(String federation) { this.federation = federation; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public List<Procedure> getProcedures() { return procedures; }
    public void setProcedures(List<Procedure> procedures) { this.procedures = procedures; }
}

