# Class Diagram Reference

## Declaration

```mermaid
classDiagram
```

## Class Definition

**Basic class:**
```mermaid
classDiagram
    class ClassName {
        +String publicAttr
        -int privateAttr
        #bool protectedAttr
        ~float packageAttr
        +publicMethod()
        -privateMethod()
        +methodWithReturn() String
        +methodWithParams(param1, param2)
    }
```

**Visibility modifiers:**
- `+` Public
- `-` Private
- `#` Protected
- `~` Package/Internal

**Member annotations:**
```mermaid
classDiagram
    class MyClass {
        +String name
        +int count$
        +getInstance()$ MyClass
        +process()* void
    }
```

- `$` Static member
- `*` Abstract method

## Relationships

| Type | Syntax | Description |
|------|--------|-------------|
| Inheritance | `<\|--` | Extends (child to parent) |
| Composition | `*--` | Strong ownership |
| Aggregation | `o--` | Weak ownership |
| Association | `-->` | Uses |
| Dependency | `..>` | Depends on |
| Realization | `..\|>` | Implements |
| Link (solid) | `--` | Related |
| Link (dashed) | `..` | Loosely related |

**With labels:**
```mermaid
classDiagram
    ClassA "1" --> "*" ClassB : contains
    ClassC <|-- ClassD : extends
```

**Cardinality:**
- `1` - Exactly one
- `0..1` - Zero or one
- `1..*` - One or more
- `*` - Many
- `n` - n instances
- `0..n` - Zero to n

## Annotations

```mermaid
classDiagram
    class Shape {
        <<interface>>
        +draw()
    }
    class Color {
        <<enumeration>>
        RED
        GREEN
        BLUE
    }
    class UserService {
        <<service>>
    }
    class AbstractClass {
        <<abstract>>
    }
```

**Common annotations:**
- `<<interface>>`
- `<<abstract>>`
- `<<enumeration>>`
- `<<service>>`
- `<<entity>>`

## Namespaces

```mermaid
classDiagram
    namespace BaseClasses {
        class Shape
        class Color
    }
    namespace Implementations {
        class Circle
        class Square
    }
    Shape <|-- Circle
    Shape <|-- Square
```

## Notes

```mermaid
classDiagram
    class MyClass
    note for MyClass "This is a note"
    note "General note"
```

## Styling

```mermaid
classDiagram
    class Animal
    class Dog
    Animal <|-- Dog
    style Animal fill:#f9f,stroke:#333
    style Dog fill:#bbf,stroke:#333
```

## Complete Example

```mermaid
classDiagram
    class Animal {
        <<abstract>>
        +String name
        +int age
        +makeSound()* void
        +move() void
    }

    class Dog {
        +String breed
        +makeSound() void
        +fetch() void
    }

    class Cat {
        +bool indoor
        +makeSound() void
        +scratch() void
    }

    class Owner {
        +String name
        +List~Animal~ pets
        +adopt(Animal) void
    }

    class Shelter {
        <<service>>
        -List~Animal~ animals
        +addAnimal(Animal) void
        +findAnimal(String) Animal
    }

    Animal <|-- Dog
    Animal <|-- Cat
    Owner "1" o-- "*" Animal : owns
    Shelter "1" *-- "*" Animal : houses
    Owner ..> Shelter : adopts from

    note for Animal "Base class for all animals"
```
