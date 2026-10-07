import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostItem } from './post-item';

describe('PostItem', () => {
  let component: PostItem;
  let fixture: ComponentFixture<PostItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostItem],
    }).compileComponents();

    fixture = TestBed.createComponent(PostItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
